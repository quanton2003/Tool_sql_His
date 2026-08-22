import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyDatabaseService } from '../company-database/company-database.service';
import { CompanyDbSnapshot } from '../entities/company-db-snapshot.entity';
import { CompanySchema } from '../entities/company-schema.entity';
import { CompanyTable } from '../entities/company-table.entity';
import { CompanyColumn } from '../entities/company-column.entity';
import { CompanyPrimaryKey } from '../entities/company-primary-key.entity';
import { CompanyForeignKey } from '../entities/company-foreign-key.entity';
import { CompanyRelation } from '../entities/company-relation.entity';

@Controller('database')
export class DatabaseExplorerController {
  constructor(
    private readonly companyDatabaseService: CompanyDatabaseService,
    @InjectRepository(CompanyDbSnapshot)
    private readonly snapshotRepository: Repository<CompanyDbSnapshot>,
    @InjectRepository(CompanySchema)
    private readonly schemaRepository: Repository<CompanySchema>,
    @InjectRepository(CompanyTable)
    private readonly tableRepository: Repository<CompanyTable>,
    @InjectRepository(CompanyColumn)
    private readonly columnRepository: Repository<CompanyColumn>,
    @InjectRepository(CompanyPrimaryKey)
    private readonly pkRepository: Repository<CompanyPrimaryKey>,
    @InjectRepository(CompanyForeignKey)
    private readonly fkRepository: Repository<CompanyForeignKey>,
    @InjectRepository(CompanyRelation)
    private readonly relationRepository: Repository<CompanyRelation>,
  ) {}

  @Get('schemas')
  async getSchemas() {
    const snapshot = await this.snapshotRepository.findOne({
      where: { status: 'success' },
      order: { createdAt: 'DESC' },
    });
    if (!snapshot) return [];

    const schemas = await this.schemaRepository.find({ where: { snapshotId: snapshot.id } });
    return schemas.map((s) => ({ schema_name: s.schemaName }));
  }

  @Get('tables')
  async getTables(@Query('schema') schema?: string) {
    const snapshot = await this.snapshotRepository.findOne({
      where: { status: 'success', schemaName: schema || 'public' },
      order: { createdAt: 'DESC' },
    });
    if (!snapshot) return [];

    const tables = await this.tableRepository.find({ where: { snapshotId: snapshot.id } });
    return tables.map((t) => ({
      table_schema: schema || 'public',
      table_name: t.tableName,
      table_type: t.tableType,
      description: t.description,
    }));
  }

  @Get('tables/search')
  async searchTables(@Query('q') query?: string, @Query('schema') schema?: string) {
    const snapshot = await this.snapshotRepository.findOne({
      where: { status: 'success', schemaName: schema || 'public' },
      order: { createdAt: 'DESC' },
    });
    if (!snapshot) return [];

    const qb = this.tableRepository.createQueryBuilder('t').where('t.snapshotId = :snapshotId', { snapshotId: snapshot.id });
    if (query) {
      qb.andWhere('LOWER(t.tableName) LIKE LOWER(:q)', { q: `%${query}%` });
    }
    const tables = await qb.getMany();

    return tables.map((t) => ({
      table_schema: schema || 'public',
      table_name: t.tableName,
      table_type: t.tableType,
      description: t.description,
    }));
  }

  @Get('tables/:tableName/columns')
  async getTableColumns(@Param('tableName') tableName: string, @Query('schema') schema?: string) {
    const snapshot = await this.snapshotRepository.findOne({
      where: { status: 'success', schemaName: schema || 'public' },
      order: { createdAt: 'DESC' },
    });
    if (!snapshot) return [];

    const table = await this.tableRepository.findOne({ where: { snapshotId: snapshot.id, tableName } });
    if (!table) return [];

    const columns = await this.columnRepository.find({ where: { tableId: table.id }, order: { id: 'ASC' } });

    const pks = await this.pkRepository.find({ where: { tableId: table.id } });
    const pkSet = new Set(pks.map((pk) => pk.columnName));

    const fks = await this.fkRepository.find({ where: { tableId: table.id } });
    const fkMap = new Map<string, string>();
    for (const fk of fks) {
      fkMap.set(fk.columnName, `${fk.foreignTableName}(${fk.foreignColumnName})`);
    }

    return columns.map((c) => ({
      column_name: c.columnName,
      data_type: c.dataType,
      is_nullable: c.isNullable,
      column_default: c.columnDefault,
      is_primary_key: pkSet.has(c.columnName),
      foreign_key: fkMap.get(c.columnName),
    }));
  }

  @Get('tables/:tableName/keys')
  async getTableKeys(@Param('tableName') tableName: string, @Query('schema') schema?: string) {
    const snapshot = await this.snapshotRepository.findOne({
      where: { status: 'success', schemaName: schema || 'public' },
      order: { createdAt: 'DESC' },
    });
    if (!snapshot) return [];

    const table = await this.tableRepository.findOne({ where: { snapshotId: snapshot.id, tableName } });
    if (!table) return [];

    const relations = await this.relationRepository.find({ where: { tableId: table.id } });
    return relations.map((r) => ({
      constraint_name: r.constraintName,
      column_name: r.columnName,
      foreign_table_name: r.foreignTableName,
      foreign_column_name: r.foreignColumnName,
    }));
  }

  @Post('company/test-connection')
  async testConnection() {
    return this.companyDatabaseService.testConnection();
  }
}
