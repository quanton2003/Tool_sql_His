import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DatabaseProfileInput, DatabaseProfilesService } from './database-profiles.service';

@Controller('database-profiles')
export class DatabaseProfilesController {
  constructor(private readonly service: DatabaseProfilesService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() data: DatabaseProfileInput) { return this.service.create(data); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<DatabaseProfileInput>) { return this.service.update(Number(id), data); }

  @Post(':id/activate')
  activate(@Param('id') id: string) { return this.service.activate(Number(id)); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(Number(id)); }
}
