import { Module } from '@nestjs/common';
import { CompanyDatabaseService } from './company-database.service';

@Module({
  providers: [CompanyDatabaseService],
  exports: [CompanyDatabaseService],
})
export class CompanyDatabaseModule {}
