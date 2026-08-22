import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
import { Knowledge } from '../entities/knowledge.entity';

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
    @InjectRepository(Knowledge)
    private readonly knowledgeRepository: Repository<Knowledge>,
  ) {}

  validateSql(sql: string): ValidationResult {
    const normalized = sql.trim().replace(/\s+/g, ' ');
    const statementCount = normalized.split(';').map((part) => part.trim()).filter(Boolean).length;
    if (statementCount !== 1) {
      return { valid: false, type: 'write', message: 'Chỉ cho phép thực thi một câu SQL mỗi lần.' };
    }
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

  async executeQuery(sql: string, request?: string, params: Record<string, unknown> = {}): Promise<{ result: QueryResult; history: SqlHistory }> {
    const validation = this.validateSql(sql);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const startTime = Date.now();
    const boundParameters: unknown[] = [];
    const parameterIndexes = new Map<string, number>();
    const executableSql = sql.replace(/(?<!:):([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, name: string) => {
      if (!Object.prototype.hasOwnProperty.call(params, name)) {
        throw new BadRequestException(`Thiếu tham số :${name}. Nhập trong ô Tham số JSON.`);
      }
      if (!parameterIndexes.has(name)) {
        parameterIndexes.set(name, boundParameters.length + 1);
        boundParameters.push(params[name]);
      }
      return `$${parameterIndexes.get(name)}`;
    });
    const client = await this.companyDatabaseService.getClient();
    try {
      const queryResult = await client.query(executableSql, boundParameters);
      const executionTime = Date.now() - startTime;
      const columns = queryResult.fields.map((f) => f.name);
      const rows = queryResult.rows;
      const rowCount = rows.length;

      const history = this.sqlHistoryRepository.create({
        request: request || sql,
        sql: executableSql,
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
        sql: executableSql,
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
    const patientCode = this.extractExplicitPatientCode(request);
    if (patientCode) {
      return {
        sql: `SELECT patientid, patientcode, patientname, birthdayyear, birthdaymonth, birthdayday, dm_gioitinhid, patientphone, patient_cmtnd, diachi\nFROM public.tb_patient\nWHERE patientcode = '${patientCode}'\nLIMIT 100;`,
        explanation: `Đã nhận diện mã bệnh nhân ${patientCode} và tạo truy vấn trực tiếp trên tb_patient. Mã được giữ dạng chuỗi trong dấu nháy đơn. Chưa tự động thực thi.`,
      };
    }
    if (process.env.OPENAI_API_KEY) {
      return this.generateWithOpenAi(request);
    }
    const snapshot = await this.snapshotRepository.findOne({ where: { status: 'success' }, order: { createdAt: 'DESC' } });
    if (!snapshot) throw new Error('Chưa có schema snapshot. Hãy đồng bộ cấu trúc trước.');

    const [tables, knowledge] = await Promise.all([
      this.tableRepository.find({ where: { snapshotId: snapshot.id } }),
      this.knowledgeRepository.find({ where: { status: 'confirmed' } }),
    ]);
    const normalize = (value: string) => value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/đ/g, 'd');
    const normalizedRequest = normalize(request);
    const originalRequest = request.toLowerCase();
    const hasPatientIntent = originalRequest.includes('bệnh nhân') || normalizedRequest.includes('benh') || normalizedRequest.includes('patient');
    const hasMedicalRecordIntent = originalRequest.includes('khám') || normalizedRequest.includes('kham') || normalizedRequest.includes('ho so benh an') || normalizedRequest.includes('medical record') || normalizedRequest.includes('lich su');
    const hasMedicineIntent = normalizedRequest.includes('thuoc') || normalizedRequest.includes('don thuoc') || normalizedRequest.includes('medication');
    const hasServiceIntent = normalizedRequest.includes('dich vu') || normalizedRequest.includes('xet nghiem') || normalizedRequest.includes('can lam sang');
    const explicitTable = tables.find((item) => normalizedRequest.includes(normalize(item.tableName)));
    const preferredPatientTable = tables.find((item) => normalize(item.tableName) === 'tb_hc_benhnhan');
    const scoredTables = tables.map((item) => {
      const tableName = normalize(item.tableName);
      let score = explicitTable?.tableName === item.tableName ? 100 : 0;
      if (hasPatientIntent) {
        if (/^tb_hc_benhnhan$/.test(tableName)) score += 30;
        else if (/hc_benhnhan|patient/.test(tableName)) score += 10;
        if (/medicalrecord/.test(tableName)) score -= 4;
      }
      if (hasMedicalRecordIntent) {
        if (/medicalrecord/.test(tableName)) score += 10;
        if (/hosobenhan|benh an/.test(tableName)) score += 7;
      }
      if (hasMedicineIntent && /medicine|thuoc|donthuoc/.test(tableName)) score += 10;
      if (hasServiceIntent && /service|dichvu|cls|lab/.test(tableName)) score += 8;
      return { item, score };
    }).sort((left, right) => right.score - left.score);
    const best = explicitTable
      ? { item: explicitTable, score: 100 }
      : hasPatientIntent && preferredPatientTable
        ? { item: preferredPatientTable, score: 100 }
        : scoredTables[0];
    if (!best || best.score === 0) {
      throw new BadRequestException('Chưa xác định được bảng phù hợp. Hãy ghi rõ tên bảng hoặc thêm Knowledge mô tả nghiệp vụ.');
    }
    const table = best.item;
    if (!table) throw new Error('Schema chưa có bảng để sinh SQL.');

    if (hasPatientIntent && /(day du|day du thong tin|lich su|kham|khoa|phong|chan doan|benh an)/.test(normalizedRequest)) {
      const joinedSql = `SELECT
  p."patientid" AS patient_id,
  p."patientcode" AS patient_code,
  p."patientname" AS patient_name,
  p."birthdayyear" AS birth_year,
  p."birthdaymonth" AS birth_month,
  p."birthdayday" AS birth_day,
  p."dm_gioitinhid" AS gender_id,
  p."patientphone" AS phone,
  p."diachi" AS address,
  pr."patientrecordid" AS patient_record_id,
  pr."patientrecorddate" AS reception_date,
  pr."chandoandenkham" AS arrival_diagnosis,
  pr."chandoandenkham_icd10" AS arrival_icd10,
  mr."medicalrecordid" AS medical_record_id,
  mr."medicalrecorddate" AS examination_date,
  mr."departmentid" AS department_id,
  d."departmentname" AS department_name,
  mr."roomid" AS room_id,
  r."roomname" AS room_name,
  mr."chandoan" AS diagnosis,
  mr."chandoan_icd10" AS diagnosis_icd10,
  mr."lydokham" AS examination_reason,
  mr."phuongphapdieutri" AS treatment_method,
  mr."huongdieutri" AS treatment_plan
FROM "${snapshot.schemaName}"."tb_patient" p
LEFT JOIN "${snapshot.schemaName}"."tb_patientrecord" pr ON pr."patientid" = p."patientid"
LEFT JOIN "${snapshot.schemaName}"."tb_medicalrecord" mr ON mr."patientrecordid" = pr."patientrecordid"
LEFT JOIN "${snapshot.schemaName}"."tb_department" d ON d."departmentid" = mr."departmentid"
LEFT JOIN "${snapshot.schemaName}"."tb_room" r ON r."roomid" = mr."roomid"
LIMIT 100;`;
      return {
        sql: joinedSql,
        explanation: 'Đã liên kết bệnh nhân -> lượt tiếp nhận -> hồ sơ khám -> khoa/phòng bằng các mã liên kết đã kiểm tra. Truy vấn chỉ đọc và chưa tự động thực thi.',
      };
    }

    const tableKnowledge = knowledge.filter((item) => item.tableName.toLowerCase() === table.tableName.toLowerCase());
    const columns = await this.columnRepository.find({ where: { tableId: table.id } });
    const selectedColumns = tableKnowledge.length > 0
      ? columns.filter((column) => tableKnowledge.some((item) => item.columnName === column.columnName))
      : columns.sort((left, right) => {
        const rank = (name: string) => /id|code|name|date|time|status|active/.test(normalize(name)) ? 0 : 1;
        return rank(left.columnName) - rank(right.columnName);
      });
    const projection = (selectedColumns.length > 0 ? selectedColumns : columns).slice(0, 20).map((column) => `"${column.columnName}"`).join(', ');
    const limit = /tat ca|toan bo|\ball\b/i.test(normalizedRequest) ? '' : '\nLIMIT 100';
    const sql = `SELECT ${projection || '*'}\nFROM "${snapshot.schemaName}"."${table.tableName}"${limit};`;
    const explicitSql = this.applyExplicitPatientCode(sql, request);
    return {
      sql: explicitSql,
      explanation: `Đã chọn bảng ${snapshot.schemaName}.${table.tableName} theo từ khóa và schema hiện có${tableKnowledge.length > 0 ? ', có dùng Knowledge đã xác nhận' : ''}. SQL chỉ đọc dữ liệu và không tự động thực thi.`,
    };
  }

  private async generateWithOpenAi(request: string): Promise<{ sql: string; explanation?: string }> {
    const schema = await this.getSchemaData();
    const knowledge = await this.knowledgeRepository.find({ order: { status: 'ASC', updatedAt: 'DESC' }, take: 120 });
    const requestWords = request.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
    const history = await this.sqlHistoryRepository.find({ where: { status: 'success' }, order: { createdAt: 'DESC' }, take: 80 });
    const historyScore = (item: SqlHistory) => requestWords.reduce((score, word) => {
      const haystack = `${item.request} ${item.sql}`.toLowerCase();
      return score + (haystack.includes(word) ? 2 : 0);
    }, 0);
    const relatedHistory = history
      .map((item) => ({ item, score: historyScore(item) }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
      .map(({ item }) => ({ request: item.request, sql: item.sql.replace(/'(?:''|[^'])*'/g, ':value').replace(/\b\d{3,}\b/g, ':number') }));
    const relatedKnowledge = knowledge.filter((item) => {
      const haystack = `${item.tableName} ${item.columnName} ${item.meaning}`.toLowerCase();
      return requestWords.some((word) => haystack.includes(word)) || /patient|benh|kham|medical|bhyt|department|room/.test(haystack);
    }).slice(0, 80);
    const knowledgeTables = new Set(relatedKnowledge.map((item) => item.tableName));
    const rankedTables = schema.tables.map((table) => ({
      table,
      score: (knowledgeTables.has(table.name) ? 10 : 0) + requestWords.reduce((score, word) => score + (table.name.toLowerCase().includes(word) ? 3 : 0), 0),
    })).sort((left, right) => right.score - left.score);
    const compactSchema = {
      tables: rankedTables.slice(0, 80).map(({ table }) => ({
        name: table.name,
        columns: schema.columns.filter((column) => column.tableId === table.id).slice(0, 40).map((column) => ({ name: column.name, type: column.type })),
      })).filter((table) => table.columns.length > 0),
      relations: schema.relations.slice(0, 150),
    };
    const knowledgeContext = relatedKnowledge.map((item) => ({ table: item.tableName, column: item.columnName, meaning: item.meaning }));
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia PostgreSQL cho HIS. Chỉ sinh truy vấn SELECT hoặc WITH. Không INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE. Chỉ dùng bảng/cột có trong schema. Hãy học cách nối bảng từ Knowledge và các SQL lịch sử, nhưng không sao chép giá trị mẫu đã được che thành :value hoặc :number. Trả JSON đúng dạng {"sql":"...", "explanation":"..."}. Nếu người dùng đã cung cấp mã bệnh nhân, phải đặt trực tiếp trong SQL dạng chuỗi có dấu nháy đơn, ví dụ patientcode = \'26135481\', không đổi thành :name. Luôn thêm LIMIT 100 nếu không phải truy vấn tổng hợp.',
          },
          {
            role: 'user',
            content: JSON.stringify({ request, schema: compactSchema, knowledge: knowledgeContext, successful_sql_patterns: relatedHistory }),
          },
        ],
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      this.logger.error(`OpenAI request failed (${response.status}): ${detail.slice(0, 300)}`);
      throw new BadRequestException('Không thể gọi OpenAI. Kiểm tra OPENAI_API_KEY và model trong file .env.');
    }
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new BadRequestException('OpenAI không trả về SQL.');
    let result: { sql?: string; explanation?: string };
    try { result = JSON.parse(content); } catch { throw new BadRequestException('OpenAI trả về định dạng không hợp lệ.'); }
    if (!result.sql || !this.validateSql(result.sql).valid) {
      throw new BadRequestException('SQL do OpenAI sinh ra không vượt qua chế độ chỉ đọc.');
    }
    const sql = this.applyExplicitPatientCode(result.sql, request);
    return { sql, explanation: `${result.explanation || 'SQL được OpenAI đề xuất.'} Chưa tự động thực thi; database HIS chỉ được đọc.` };
  }

  private applyExplicitPatientCode(sql: string, request: string) {
    const patientCode = this.extractExplicitPatientCode(request);
    if (!patientCode) return sql;
    const withoutDuplicatePatientFilter = sql.replace(/(\bWHERE\s+patientcode\s*=\s*'[^']*')\s+WHERE\s+patientcode\s*=\s*'[^']*'/gi, '$1');
    if (!/\bpatientcode\b/i.test(sql)) {
      return `SELECT patientid, patientcode, patientname, birthdayyear, birthdaymonth, birthdayday, dm_gioitinhid, patientphone, patient_cmtnd, diachi\nFROM public.tb_patient\nWHERE patientcode = '${patientCode}'\nLIMIT 100;`;
    }
    const quotedCode = `'${patientCode}'`;
    const replaced = withoutDuplicatePatientFilter.replace(/(patientcode\s*=\s*)(?::[A-Za-z_][A-Za-z0-9_]*|'[^']*'|[A-Za-z0-9_-]+)/i, `$1${quotedCode}`);
    if (replaced !== withoutDuplicatePatientFilter) return replaced;
    return withoutDuplicatePatientFilter.replace(/\s+LIMIT\s+\d+\s*;?\s*$/i, `\nWHERE patientcode = ${quotedCode}\nLIMIT 100;`);
  }

  private extractExplicitPatientCode(request: string) {
    const match = request.match(/\b(?:mã|ma)\b(?:\s+(?:bệnh\s+nhân|benh\s+nhan))?(?:\s+(?:là|la|:|=))?\s*([0-9][A-Za-z0-9_-]*)/i)
      || request.match(/\bpatientcode\b\s*(?:là|la|:|=)?\s*([A-Za-z0-9_-]+)/i);
    return match?.[1].replace(/'/g, "''");
  }
}
