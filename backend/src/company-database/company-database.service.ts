import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { SettingsService } from '../settings/settings.service';

export interface SchemaInfo {
  schema_name: string;
}

export interface TableInfo {
  table_schema: string;
  table_name: string;
  table_type: string;
  description?: string;
}

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
  is_primary_key: boolean;
  foreign_key?: string;
}

export interface PrimaryKeyInfo {
  column_name: string;
}

export interface ForeignKeyInfo {
  constraint_name: string;
  column_name: string;
  foreign_table_schema: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

@Injectable()
export class CompanyDatabaseService {
  private readonly logger = new Logger(CompanyDatabaseService.name);
  private pool: Pool | null = null;
  private connected = false;
  private configLoaded = false;

  constructor(private readonly settingsService: SettingsService) {}

  async loadConfig() {
    const host = await this.settingsService.findOne('HIS_DB_HOST');
    const port = await this.settingsService.findOne('HIS_DB_PORT');
    const database = await this.settingsService.findOne('HIS_DB_NAME');
    const user = await this.settingsService.findOne('HIS_DB_USER');
    const password = await this.settingsService.findOne('HIS_DB_PASSWORD');
    const schema = await this.settingsService.findOne('HIS_DB_SCHEMA');

    if (!host || !database || !user) {
      throw new Error('Chưa cấu hình Company Database. Vào Settings để cấu hình.');
    }

    return {
      host,
      port: Number(port) || 5432,
      database,
      user,
      password: password || '',
      schema: schema || 'public',
    };
  }

  async getPool(): Promise<Pool> {
    const config = await this.loadConfig();
    if (!this.pool) {
      this.pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: false,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }
    return this.pool;
  }

  async getClient(): Promise<PoolClient> {
    try {
      return await (await this.getPool()).connect();
    } catch (error) {
      this.logger.warn('Pool connection failed, recreating pool...', (error as Error).message);
      await this.reload();
      return await (await this.getPool()).connect();
    }
  }

  async reload() {
    if (this.pool) {
      try {
        await this.pool.end();
      } catch {
        // ignore
      }
      this.pool = null;
    }
  }

  async getSchemas(): Promise<SchemaInfo[]> {
    const client = await this.getClient();
    try {
      const result = await client.query<SchemaInfo>(`
        SELECT schema_name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        ORDER BY schema_name
      `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTables(schemaName: string = 'public'): Promise<TableInfo[]> {
    const client = await this.getClient();
    try {
      const result = await client.query<TableInfo>(`
        SELECT schemaname AS table_schema, tablename AS table_name, 'BASE TABLE' AS table_type
        FROM pg_catalog.pg_tables
        WHERE schemaname = $1
        ORDER BY tablename
      `, [schemaName]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async searchTables(query: string, schemaName: string = 'public'): Promise<TableInfo[]> {
    const client = await this.getClient();
    try {
      const result = await client.query<TableInfo>(`
        SELECT schemaname AS table_schema, tablename AS table_name, 'BASE TABLE' AS table_type
        FROM pg_catalog.pg_tables
        WHERE schemaname = $1
          AND tablename ILIKE $2
        ORDER BY tablename
      `, [schemaName, `%${query}%`]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTableColumns(tableName: string, schemaName: string = 'public'): Promise<ColumnInfo[]> {
    const client = await this.getClient();
    try {
      const columnsResult = await client.query(`
        SELECT 
          a.attname AS column_name,
          pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
          CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END AS is_nullable,
          pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS column_default
        FROM pg_catalog.pg_attribute a
        LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE a.attrelid = ($1 || '.' || $2)::regclass::oid
          AND a.attnum > 0
          AND NOT a.attisdropped
        ORDER BY a.attnum
      `, [schemaName, tableName]);

      const pkResult = await client.query<PrimaryKeyInfo>(`
        SELECT a.attname AS column_name
        FROM pg_catalog.pg_index i
        JOIN pg_catalog.pg_class c ON c.oid = i.indrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
        WHERE n.nspname = $1
          AND c.relname = $2
          AND i.indisprimary
        ORDER BY a.attnum
      `, [schemaName, tableName]);

      const pkColumns = new Set<string>(pkResult.rows.map((r) => r.column_name));

      const fkResult = await client.query<ForeignKeyInfo>(`
        SELECT 
          a.attname AS column_name,
          n2.nspname AS foreign_table_schema,
          c2.relname AS foreign_table_name,
          a2.attname AS foreign_column_name
        FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum = con.conkey[1]
        JOIN pg_catalog.pg_class c2 ON c2.oid = con.confrelid
        JOIN pg_catalog.pg_namespace n2 ON n2.oid = c2.relnamespace
        JOIN pg_catalog.pg_attribute a2 ON a2.attrelid = c2.oid AND a2.attnum = con.confkey[1]
        WHERE n.nspname = $1
          AND c.relname = $2
          AND con.contype = 'f'
        ORDER BY a.attnum
      `, [schemaName, tableName]);

      const fkMap = new Map<string, ForeignKeyInfo>();
      for (const fk of fkResult.rows) {
        fkMap.set(fk.column_name, fk);
      }

      return columnsResult.rows.map((row) => ({
        column_name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable,
        column_default: row.column_default,
        is_primary_key: pkColumns.has(row.column_name),
        foreign_key: fkMap.has(row.column_name)
          ? `${fkMap.get(row.column_name)!.foreign_table_name}(${fkMap.get(row.column_name)!.foreign_column_name})`
          : undefined,
      }));
    } finally {
      client.release();
    }
  }

  async getTableRelations(tableName: string, schemaName: string = 'public'): Promise<ForeignKeyInfo[]> {
    const client = await this.getClient();
    try {
      const result = await client.query<ForeignKeyInfo>(`
        SELECT 
          con.conname AS constraint_name,
          a.attname AS column_name,
          n2.nspname AS foreign_table_schema,
          c2.relname AS foreign_table_name,
          a2.attname AS foreign_column_name
        FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum = con.conkey[1]
        JOIN pg_catalog.pg_class c2 ON c2.oid = con.confrelid
        JOIN pg_catalog.pg_namespace n2 ON n2.oid = c2.relnamespace
        JOIN pg_catalog.pg_attribute a2 ON a2.attrelid = c2.oid AND a2.attnum = con.confkey[1]
        WHERE n.nspname = $1
          AND c.relname = $2
          AND con.contype = 'f'
        ORDER BY a.attnum
      `, [schemaName, tableName]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const config = await this.loadConfig();
      this.logger.log(`Testing connection to ${config.host}:${config.port}/${config.database} as ${config.user}`);
      await this.reload();
      const client = await this.getClient();
      try {
        await client.query('SELECT 1');
        this.connected = true;
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to connect to HIS database', (error as Error).stack || (error as Error).message);
      this.connected = false;
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
