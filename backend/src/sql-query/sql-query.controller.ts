import { Controller, Post, Body, Get, Query, Param, UseGuards } from '@nestjs/common';
import { SqlQueryService } from './sql-query.service';

@Controller('sql-query')
export class SqlQueryController {
  constructor(private readonly sqlQueryService: SqlQueryService) {}

  @Post('execute')
  async execute(@Body() body: { sql: string; request?: string; params?: Record<string, unknown> }) {
    return this.sqlQueryService.executeQuery(body.sql, body.request, body.params || {});
  }

  @Post('validate')
  validate(@Body() body: { sql: string }) {
    return this.sqlQueryService.validateSql(body.sql);
  }

  @Get('autocomplete')
  async autocomplete() {
    return this.sqlQueryService.getAutocompleteData();
  }

  @Get('schema')
  async getSchema() {
    return this.sqlQueryService.getSchemaData();
  }

  @Get('tables/:schema/:table/data')
  async getTableData(@Param('schema') schema: string, @Param('table') table: string, @Query('limit') limit?: string) {
    return this.sqlQueryService.getTablePreview(schema, table, limit ? Number(limit) : 100);
  }

  @Get('history')
  async getHistory(@Query('limit') limit?: string) {
    return this.sqlQueryService.getSqlHistory(limit ? Number(limit) : 50);
  }

  @Post('ai/generate')
  async aiGenerate(@Body() body: { request: string }) {
    return this.sqlQueryService.generateAiSql(body.request);
  }
}
