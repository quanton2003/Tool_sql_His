import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class SettingsInitializerService implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {}

  async onModuleInit() {
    await this.ensureSetting('HIS_DB_HOST', this.configService.get<string>('HIS_DB_HOST', ''));
    await this.ensureSetting('HIS_DB_PORT', this.configService.get<string>('HIS_DB_PORT', '5432'));
    await this.ensureSetting('HIS_DB_NAME', this.configService.get<string>('HIS_DB_NAME', ''));
    await this.ensureSetting('HIS_DB_USER', this.configService.get<string>('HIS_DB_USER', ''));
    await this.ensureSetting('HIS_DB_PASSWORD', this.configService.get<string>('HIS_DB_PASSWORD', ''));
    await this.ensureSetting('HIS_DB_SCHEMA', this.configService.get<string>('HIS_DB_SCHEMA', 'public'));
  }

  private async ensureSetting(key: string, defaultValue: string) {
    const existing = await this.settingsService.findOne(key);
    if (!existing && defaultValue) {
      await this.settingsService.create(key, defaultValue);
    }
  }
}
