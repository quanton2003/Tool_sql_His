import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { CompanyDatabaseModule } from './company-database/company-database.module';
import { SchemaSnapshotModule } from './schema-snapshot/schema-snapshot.module';
import { ChucNangModule } from './chuc-nang/chuc-nang.module';
import { DatabaseExplorerModule } from './database-explorer/database-explorer.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { SettingsModule } from './settings/settings.module';
import { SqlQueryModule } from './sql-query/sql-query.module';
import { DatabaseProfilesModule } from './database-profiles/database-profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
    HealthModule,
    DatabaseModule,
    CompanyDatabaseModule,
    SchemaSnapshotModule,
    ChucNangModule,
    DatabaseExplorerModule,
    KnowledgeModule,
    SettingsModule,
    SqlQueryModule,
    DatabaseProfilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
