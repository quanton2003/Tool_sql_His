import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseExplorerController } from './database-explorer.controller';
import { CompanyDatabaseModule } from '../company-database/company-database.module';
import { CompanyDbSnapshot } from '../entities/company-db-snapshot.entity';
import { CompanySchema } from '../entities/company-schema.entity';
import { CompanyTable } from '../entities/company-table.entity';
import { CompanyColumn } from '../entities/company-column.entity';
import { CompanyPrimaryKey } from '../entities/company-primary-key.entity';
import { CompanyForeignKey } from '../entities/company-foreign-key.entity';
import { CompanyRelation } from '../entities/company-relation.entity';

@Module({
  imports: [
    CompanyDatabaseModule,
    TypeOrmModule.forFeature([
      CompanyDbSnapshot,
      CompanySchema,
      CompanyTable,
      CompanyColumn,
      CompanyPrimaryKey,
      CompanyForeignKey,
      CompanyRelation,
    ]),
  ],
  controllers: [DatabaseExplorerController],
  providers: [],
  exports: [],
})
export class DatabaseExplorerModule {}
