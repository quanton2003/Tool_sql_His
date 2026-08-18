import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyDatabaseService } from '../company-database/company-database.service';
import { CompanyDbSnapshot } from '../entities/company-db-snapshot.entity';
import { CompanySchema } from '../entities/company-schema.entity';
import { CompanyTable } from '../entities/company-table.entity';
import { CompanyColumn } from '../entities/company-column.entity';
import { CompanyPrimaryKey } from '../entities/company-primary-key.entity';
import { CompanyForeignKey } from '../entities/company-foreign-key.entity';
import { CompanyIndex } from '../entities/company-index.entity';
import { CompanyRelation } from '../entities/company-relation.entity';

@Injectable()
export class SchemaSnapshotService {
  private readonly logger = new Logger(SchemaSnapshotService.name);

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
    @InjectRepository(CompanyIndex)
    private readonly indexRepository: Repository<CompanyIndex>,
    @InjectRepository(CompanyRelation)
    private readonly relationRepository: Repository<CompanyRelation>,
  ) {}

  async syncSchema(databaseName: string, schemaName: string = 'public') {
    const snapshot = this.snapshotRepository.create({
      databaseName,
      schemaName,
      tableCount: 0,
      columnCount: 0,
      status: 'syncing',
    });
    await this.snapshotRepository.save(snapshot);

    try {
      const [schemas, tables] = await Promise.all([
        this.companyDatabaseService.getSchemas(),
        this.companyDatabaseService.getTables(schemaName),
      ]);

      const schemaEntities = schemas.map((s) =>
        this.schemaRepository.create({ snapshotId: snapshot.id, schemaName: s.schema_name }),
      );
      await this.schemaRepository.insert(schemaEntities);

      const schemaIdMap = new Map<string, number>();
      for (const s of schemaEntities) {
        schemaIdMap.set(s.schemaName, s.id);
      }

      const tableEntities = tables.map((t) =>
        this.tableRepository.create({
          snapshotId: snapshot.id,
          schemaId: schemaIdMap.get(t.table_schema) || 0,
          tableName: t.table_name,
          description: t.description,
          tableType: t.table_type,
        }),
      );
      await this.tableRepository.insert(tableEntities);

      const tableIdMap = new Map<string, number>();
      for (const t of tableEntities) {
        tableIdMap.set(t.tableName, t.id);
      }

      let totalColumns = 0;
      for (const table of tables) {
        const tableId = tableIdMap.get(table.table_name);
        if (!tableId) continue;

        const columns = await this.companyDatabaseService.getTableColumns(table.table_name, schemaName);
        const columnEntities = columns.map((c) =>
          this.columnRepository.create({
            tableId,
            columnName: c.column_name,
            dataType: c.data_type,
            isNullable: c.is_nullable,
            columnDefault: c.column_default,
            isPrimaryKey: c.is_primary_key,
            foreignKey: c.foreign_key,
          }),
        );
        await this.columnRepository.insert(columnEntities);
        totalColumns += columnEntities.length;

        const relations = await this.companyDatabaseService.getTableRelations(table.table_name, schemaName);
        const relationEntities = relations.map((r) =>
          this.relationRepository.create({
            tableId,
            constraintName: r.constraint_name,
            columnName: r.column_name,
            foreignTableName: r.foreign_table_name,
            foreignColumnName: r.foreign_column_name,
          }),
        );
        await this.relationRepository.insert(relationEntities);
      }

      snapshot.tableCount = tables.length;
      snapshot.columnCount = totalColumns;
      snapshot.status = 'success';
      await this.snapshotRepository.save(snapshot);

      return snapshot;
    } catch (error) {
      this.logger.error('Failed to sync schema', error);
      snapshot.status = 'error';
      snapshot.error = error instanceof Error ? error.message : String(error);
      await this.snapshotRepository.save(snapshot);
      throw error;
    }
  }

  async getLatestSnapshot() {
    return this.snapshotRepository.findOne({
      where: { status: 'success' },
      order: { createdAt: 'DESC' },
    });
  }

  async getSnapshots() {
    return this.snapshotRepository.find({ order: { createdAt: 'DESC' } });
  }
}
