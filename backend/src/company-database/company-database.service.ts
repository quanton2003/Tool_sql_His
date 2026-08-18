import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

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

  constructor(private configService: ConfigService) {}

  private getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        host: this.configService.get<string>('HIS_DB_HOST', 'localhost'),
        port: this.configService.get<number>('HIS_DB_PORT', 5432),
        database: this.configService.get<string>('HIS_DB_NAME', 'his_db'),
        user: this.configService.get<string>('HIS_DB_USER', 'his_readonly'),
        password: this.configService.get<string>('HIS_DB_PASSWORD', ''),
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }
    return this.pool;
  }

  async getSchemas(): Promise<SchemaInfo[]> {
    const client = await this.getPool().connect();
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
    const client = await this.getPool().connect();
    try {
      const result = await client.query<TableInfo>(`
        SELECT 
          t.table_schema,
          t.table_name,
          t.table_type,
          obj_description(('"' || t.table_schema || '"."' || t.table_name || '"')::regclass) AS description
        FROM information_schema.tables t
        WHERE t.table_schema = $1
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
      `, [schemaName]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async searchTables(query: string, schemaName: string = 'public'): Promise<TableInfo[]> {
    const client = await this.getPool().connect();
    try {
      const result = await client.query<TableInfo>(`
        SELECT 
          t.table_schema,
          t.table_name,
          t.table_type,
          obj_description(('"' || t.table_schema || '"."' || t.table_name || '"')::regclass) AS description
        FROM information_schema.tables t
        WHERE t.table_schema = $1
          AND t.table_type = 'BASE TABLE'
          AND t.table_name ILIKE $2
        ORDER BY t.table_name
      `, [schemaName, `%${query}%`]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTableColumns(tableName: string, schemaName: string = 'public'): Promise<ColumnInfo[]> {
    const client = await this.getPool().connect();
    try {
      const columnsResult = await client.query(`
        SELECT 
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default
        FROM information_schema.columns c
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position
      `, [schemaName, tableName]);

      const pkResult = await client.query<PrimaryKeyInfo>(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      `, [schemaName, tableName]);

      const pkColumns = new Set(pkResult.rows.map((r) => r.column_name));

      const fkResult = await client.query<ForeignKeyInfo>(`
        SELECT 
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
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
    const client = await this.getPool().connect();
    try {
      const result = await client.query<ForeignKeyInfo>(`
        SELECT 
          tc.constraint_name,
          kcu.column_name,
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = $1
          AND tc.table_name = $2
      `, [schemaName, tableName]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getPool().connect();
      try {
        await client.query('SELECT 1');
        this.connected = true;
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to connect to HIS database', error);
      this.connected = false;
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
