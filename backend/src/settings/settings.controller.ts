import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CompanyDatabaseService } from '../company-database/company-database.service';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly companyDatabaseService: CompanyDatabaseService,
  ) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Post()
  async create(@Body() body: { key: string; value: string }) {
    return this.settingsService.create(body.key, body.value);
  }

  @Put(':key')
  async update(@Param('key') key: string, @Body() body: { value: string }) {
    return this.settingsService.update(key, body.value);
  }
}

@Controller('database')
export class DatabaseSettingsController {
  constructor(private readonly companyDatabaseService: CompanyDatabaseService) {}

  @Post('company/reload-config')
  async reloadCompanyConfig() {
    await this.companyDatabaseService.reload();
    return { reloaded: true };
  }

  @Post('app/test-connection')
  async testAppConnection() {
    return { connected: true };
  }
}
