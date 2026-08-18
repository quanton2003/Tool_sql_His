import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { CompanyDatabaseService } from './company-database.service';

@Module({
  imports: [SettingsModule],
  providers: [CompanyDatabaseService],
  exports: [CompanyDatabaseService],
})
export class CompanyDatabaseModule {}
