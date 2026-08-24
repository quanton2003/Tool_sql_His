import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
    AuthModule,
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
