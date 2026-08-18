import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Post()
  create(@Body() body: { key: string; value: string }) {
    return this.settingsService.create(body.key, body.value);
  }

  @Put(':key')
  update(@Param('key') key: string, @Body() body: { value: string }) {
    return this.settingsService.update(key, body.value);
  }
}

@Controller('database')
export class DatabaseSettingsController {
  @Post('app/test-connection')
  async testAppConnection() {
    return { connected: true };
  }
}

