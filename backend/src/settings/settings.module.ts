import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { DatabaseSettingsController } from './settings.controller';
import { Setting } from '../entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [SettingsController, DatabaseSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
