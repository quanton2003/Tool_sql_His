import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';
import { Knowledge } from '../entities/knowledge.entity';
import { CompanyDatabaseModule } from '../company-database/company-database.module';
import { CompanyDbSnapshot } from '../entities/company-db-snapshot.entity';
import { CompanyTable } from '../entities/company-table.entity';
import { CompanyColumn } from '../entities/company-column.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Knowledge, CompanyDbSnapshot, CompanyTable, CompanyColumn]), CompanyDatabaseModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
