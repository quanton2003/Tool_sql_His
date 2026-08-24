import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Setting } from '../entities/setting.entity';
import { CompanyDbSnapshot } from '../entities/company-db-snapshot.entity';
import { CompanySchema } from '../entities/company-schema.entity';
import { CompanyTable } from '../entities/company-table.entity';
import { CompanyColumn } from '../entities/company-column.entity';
import { CompanyPrimaryKey } from '../entities/company-primary-key.entity';
import { CompanyForeignKey } from '../entities/company-foreign-key.entity';
import { CompanyIndex } from '../entities/company-index.entity';
import { CompanyRelation } from '../entities/company-relation.entity';
import { ChucNang } from '../entities/chuc-nang.entity';
import { Knowledge } from '../entities/knowledge.entity';
import { SqlTemplate } from '../entities/sql-template.entity';
import { SqlHistory } from '../entities/sql-history.entity';
import { Note } from '../entities/note.entity';
import { DatabaseProfile } from '../entities/database-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [
              Setting,
              CompanyDbSnapshot,
              CompanySchema,
              CompanyTable,
              CompanyColumn,
              CompanyPrimaryKey,
              CompanyForeignKey,
              CompanyIndex,
              CompanyRelation,
              ChucNang,
              Knowledge,
              SqlTemplate,
              SqlHistory,
              Note,
              DatabaseProfile,
            ],
            synchronize: true,
            logging: false,
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }
        return {
          type: 'better-sqlite3',
          database: configService.get<string>('APP_DB_PATH', './data/app.sqlite'),
          entities: [
            Setting,
            CompanyDbSnapshot,
            CompanySchema,
            CompanyTable,
            CompanyColumn,
            CompanyPrimaryKey,
            CompanyForeignKey,
            CompanyIndex,
            CompanyRelation,
            ChucNang,
            Knowledge,
            SqlTemplate,
            SqlHistory,
            Note,
            DatabaseProfile,
          ],
          synchronize: true,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Setting,
      CompanyDbSnapshot,
      CompanySchema,
      CompanyTable,
      CompanyColumn,
      CompanyPrimaryKey,
      CompanyForeignKey,
      CompanyIndex,
      CompanyRelation,
      ChucNang,
      Knowledge,
      SqlTemplate,
      SqlHistory,
      Note,
      DatabaseProfile,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
