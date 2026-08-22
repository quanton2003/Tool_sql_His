import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SqlQueryController } from './sql-query.controller';
import { SqlQueryService } from './sql-query.service';
import { SqlHistory } from '../entities/sql-history.entity';
import { CompanyDbSnapshot } from '../entities/company-db-snapshot.entity';
import { CompanySchema } from '../entities/company-schema.entity';
import { CompanyTable } from '../entities/company-table.entity';
import { CompanyColumn } from '../entities/company-column.entity';
import { CompanyRelation } from '../entities/company-relation.entity';
import { CompanyDatabaseModule } from '../company-database/company-database.module';
import { SchemaSnapshotModule } from '../schema-snapshot/schema-snapshot.module';
import { Knowledge } from '../entities/knowledge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SqlHistory, CompanyDbSnapshot, CompanySchema, CompanyTable, CompanyColumn, CompanyRelation, Knowledge]), CompanyDatabaseModule, SchemaSnapshotModule],
  controllers: [SqlQueryController],
  providers: [SqlQueryService],
  exports: [SqlQueryService],
})
export class SqlQueryModule {}
