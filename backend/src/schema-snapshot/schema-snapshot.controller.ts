import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SchemaSnapshotService } from './schema-snapshot.service';

@Controller('database')
export class SchemaSnapshotController {
  constructor(private readonly schemaSnapshotService: SchemaSnapshotService) {}

  @Get('snapshots')
  async getSnapshots() {
    return this.schemaSnapshotService.getSnapshots();
  }

  @Post('company/sync-schema')
  async syncSchema(@Body() body: { databaseName: string; schemaName?: string }) {
    return this.schemaSnapshotService.syncSchema(body.databaseName, body.schemaName);
  }
}
