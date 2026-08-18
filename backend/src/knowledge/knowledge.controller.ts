import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  findAll(@Query('tableName') tableName?: string) {
    return this.knowledgeService.findAll(tableName);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(Number(id));
  }

  @Post()
  create(@Body() data: any) {
    return this.knowledgeService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.knowledgeService.update(Number(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.knowledgeService.remove(Number(id));
  }
}
