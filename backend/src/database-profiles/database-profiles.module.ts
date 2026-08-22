import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyDatabaseModule } from '../company-database/company-database.module';
import { DatabaseProfile } from '../entities/database-profile.entity';
import { DatabaseProfilesController } from './database-profiles.controller';
import { DatabaseProfilesService } from './database-profiles.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseProfile]), CompanyDatabaseModule, SettingsModule],
  controllers: [DatabaseProfilesController],
  providers: [DatabaseProfilesService],
})
export class DatabaseProfilesModule {}
