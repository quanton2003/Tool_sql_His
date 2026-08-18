import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { DatabaseSettingsController } from './settings.controller';
import { SettingsInitializerService } from './settings-initializer.service';
import { CompanyDatabaseModule } from '../company-database/company-database.module';
import { Setting } from '../entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting]), forwardRef(() => CompanyDatabaseModule)],
  controllers: [SettingsController, DatabaseSettingsController],
  providers: [SettingsService, SettingsInitializerService],
  exports: [SettingsService],
})
export class SettingsModule {}
