import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SqlHistory } from '../entities/sql-history.entity';
import { CompanyDatabaseService } from '../company-database/company-database.service';
import { SchemaSnapshotService } from '../schema-snapshot/schema-snapshot.service';
import { CompanySchema } from '../entities/company-schema.entity';
import { CompanyTable } from '../entities/company-table.entity';
import { CompanyColumn } from '../entities/company-column.entity';
import { CompanyRelation } from '../entities/company-relation.entity';
import { CompanyDbSnapshot } from '../entities/company-db-snapshot.entity';

export interface AutocompleteItem {
  label: string;
  kind: string;
  detail?: string;
  insertText: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

export interface ValidationResult {
  valid: boolean;
  type: 'read' | 'write';
  message?: string;
}

@Injectable()
export class SqlQueryService {
  private readonly logger = new Logger(SqlQueryService.name);
  private readonly WRITE_KEYWORDS = [
    'INSERT', 'UPDATE', 'DELETE', 'UPSERT', 'MERGE', 'ALTER', 'DROP', 'TRUNCATE',
    'CREATE', 'GRANT', 'REVOKE', 'COMMENT', 'VACUUM', 'REINDEX', 'CLUSTER',
  ];

  constructor(
    private readonly companyDatabaseService: CompanyDatabaseService,
    private readonly schemaSnapshotService: SchemaSnapshotService,
    @InjectRepository(SqlHistory)
    private readonly sqlHistoryRepository: Repository<SqlHistory>,
    @InjectRepository(CompanyDbSnapshot)
    private readonly snapshotRepository: Repository<CompanyDbSnapshot>,
    @InjectRepository(CompanySchema)
    private readonly schemaRepository: Repository<CompanySchema>,
    @InjectRepository(CompanyTable)
    private readonly tableRepository: Repository<CompanyTable>,
    @InjectRepository(CompanyColumn)
    private readonly columnRepository: Repository<CompanyColumn>,
    @InjectRepository(CompanyRelation)
    private readonly relationRepository: Repository<CompanyRelation>,
  ) {}

  validateSql(sql: string): ValidationResult {
    const normalized = sql.trim().replace(/\s+/g, ' ');
    const upper = normalized.toUpperCase();

    for (const keyword of this.WRITE_KEYWORDS) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(normalized)) {
        return {
          valid: false,
          type: 'write',
          message: 'WRITE QUERY: Query này có thể thay đổi dữ liệu/database. Không được phép thực thi.',
        };
      }
    }

    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH') && !upper.startsWith('EXPLAIN')) {
      return {
        valid: false,
        type: 'write',
        message: 'WRITE QUERY: Chỉ cho phép SELECT, WITH, EXPLAIN.',
      };
    }

    return { valid: true, type: 'read' };
  }

  async executeQuery(sql: string, request?: string): Promise<{ result: QueryResult; history: SqlHistory }> {
    const validation = this.validateSql(sql);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const startTime = Date.now();
    const client = await this.companyDatabaseService.getClient();
    try {
      const queryResult = await client.query(sql);
      const executionTime = Date.now() - startTime;
      const columns = queryResult.fields.map((f) => f.name);
      const rows = queryResult.rows;
      const rowCount = rows.length;

      const history = this.sqlHistoryRepository.create({
        request: request || sql,
        sql,
        status: 'success',
        type: validation.type,
        executionTime,
        rowCount,
      });
      await this.sqlHistoryRepository.save(history);

      return {
        result: { columns, rows, rowCount, executionTime },
        history,
      };
    } catch (error) {
      const history = this.sqlHistoryRepository.create({
        request: request || sql,
        sql,
        status: 'error',
        type: validation.type,
        executionTime: Date.now() - startTime,
        rowCount: 0,
      });
      await this.sqlHistoryRepository.save(history);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTablePreview(schemaName: string, tableName: string, limit: number = 100): Promise<QueryResult> {
    const sql = `SELECT * FROM "${schemaName}"."${tableName}" LIMIT ${limit}`;
    const { result } = await this.executeQuery(sql, `View data: ${schemaName}.${tableName}`);
    return result;
  }

  async getAutocompleteData(): Promise<AutocompleteItem[]> {
    const snap = await this.snapshotRepository.findOne({ where: { status: 'success' }, order: { createdAt: 'DESC' } });
    if (!snap) return [];

    const items: AutocompleteItem[] = [
      { label: 'SELECT', kind: 'keyword', insertText: 'SELECT ' },
      { label: 'FROM', kind: 'keyword', insertText: 'FROM ' },
      { label: 'WHERE', kind: 'keyword', insertText: 'WHERE ' },
      { label: 'JOIN', kind: 'keyword', insertText: 'JOIN ' },
      { label: 'ON', kind: 'keyword', insertText: 'ON ' },
      { label: 'GROUP BY', kind: 'keyword', insertText: 'GROUP BY ' },
      { label: 'ORDER BY', kind: 'keyword', insertText: 'ORDER BY ' },
      { label: 'LIMIT', kind: 'keyword', insertText: 'LIMIT ' },
      { label: 'AND', kind: 'keyword', insertText: 'AND ' },
      { label: 'OR', kind: 'keyword', insertText: 'OR ' },
      { label: 'AS', kind: 'keyword', insertText: ' AS ' },
      { label: 'DISTINCT', kind: 'keyword', insertText: 'DISTINCT ' },
      { label: 'COUNT', kind: 'function', insertText: 'COUNT($1)' },
      { label: 'SUM', kind: 'function', insertText: 'SUM($1)' },
      { label: 'AVG', kind: 'function', insertText: 'AVG($1)' },
      { label: 'MAX', kind: 'function', insertText: 'MAX($1)' },
      { label: 'MIN', kind: 'function', insertText: 'MIN($1)' },
      { label: 'COALESCE', kind: 'function', insertText: 'COALESCE($1, $2)' },
      { label: 'NULLIF', kind: 'function', insertText: 'NULLIF($1, $2)' },
      { label: 'CAST', kind: 'function', insertText: 'CAST($1 AS $2)' },
      { label: 'CASE', kind: 'keyword', insertText: 'CASE WHEN $1 THEN $2 ELSE $3 END' },
      { label: 'WHEN', kind: 'keyword', insertText: 'WHEN ' },
      { label: 'THEN', kind: 'keyword', insertText: 'THEN ' },
      { label: 'ELSE', kind: 'keyword', insertText: 'ELSE ' },
      { label: 'END', kind: 'keyword', insertText: 'END' },
      { label: 'INNER JOIN', kind: 'keyword', insertText: 'INNER JOIN ' },
      { label: 'LEFT JOIN', kind: 'keyword', insertText: 'LEFT JOIN ' },
      { label: 'RIGHT JOIN', kind: 'keyword', insertText: 'RIGHT JOIN ' },
      { label: 'HAVING', kind: 'keyword', insertText: 'HAVING ' },
      { label: 'UNION', kind: 'keyword', insertText: 'UNION ' },
      { label: 'EXISTS', kind: 'keyword', insertText: 'EXISTS ($1)' },
      { label: 'BETWEEN', kind: 'keyword', insertText: 'BETWEEN $1 AND $2' },
      { label: 'LIKE', kind: 'keyword', insertText: 'LIKE ' },
      { label: 'ILIKE', kind: 'keyword', insertText: 'ILIKE ' },
      { label: 'IS NULL', kind: 'keyword', insertText: 'IS NULL' },
      { label: 'IS NOT NULL', kind: 'keyword', insertText: 'IS NOT NULL' },
    ];

    const schemas = await this.schemaRepository.find({ where: { snapshotId: snap.id } });
    for (const schema of schemas) {
      items.push({ label: schema.schemaName, kind: 'schema', insertText: `${schema.schemaName}.` });

      const tables = await this.tableRepository.find({ where: { schemaId: schema.id, snapshotId: snap.id } });
      for (const table of tables) {
        const alias = table.tableName.substring(0, 3).toLowerCase();
        items.push({ label: `${schema.schemaName}.${table.tableName}`, kind: 'table', detail: schema.schemaName, insertText: `${table.tableName} AS ${alias}` });
        items.push({ label: `${alias}.`, kind: 'alias', detail: `${schema.schemaName}.${table.tableName}`, insertText: `${alias}.` });
      }
    }

    return items;
  }

  async getSchemaData() {
    const snap = await this.snapshotRepository.findOne({ where: { status: 'success' }, order: { createdAt: 'DESC' } });
    if (!snap) return { schemas: [], tables: [], columns: [], relations: [] };

    const schemas = await this.schemaRepository.find({ where: { snapshotId: snap.id } });
    const tables = await this.tableRepository.find({ where: { snapshotId: snap.id } });
    const tableIds = tables.map((t) => t.id);
    const columns = tableIds.length > 0 ? await this.columnRepository.find({ where: { tableId: In(tableIds) } }) : [];
    const relations = tableIds.length > 0 ? await this.relationRepository.find({ where: { tableId: In(tableIds) } }) : [];

    return {
      schemas: schemas.map((s) => ({ id: s.id, name: s.schemaName })),
      tables: tables.map((t) => ({ id: t.id, schemaId: t.schemaId, name: t.tableName })),
      columns: columns.map((c) => ({ id: c.id, tableId: c.tableId, name: c.columnName, type: c.dataType, isPk: c.isPrimaryKey, fk: c.foreignKey })),
      relations: relations.map((r) => ({ tableId: r.tableId, column: r.columnName, foreignTable: r.foreignTableName, foreignColumn: r.foreignColumnName })),
    };
  }

  async getSqlHistory(limit: number = 50) {
    return this.sqlHistoryRepository.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async generateAiSql(request: string): Promise<{ sql: string; explanation?: string }> {
    throw new Error('AI generation not implemented yet. Please integrate AI provider.');
  }
}
