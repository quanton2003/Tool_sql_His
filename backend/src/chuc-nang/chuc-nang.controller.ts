import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ChucNangService } from './chuc-nang.service';

@Controller('chuc-nang')
export class ChucNangController {
  constructor(private readonly chucNangService: ChucNangService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.chucNangService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chucNangService.findOne(Number(id));
  }

  @Post()
  create(@Body() data: { ten: string; moTa: string; trangThai: string }) {
    return this.chucNangService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: { ten?: string; moTa?: string; trangThai?: string }) {
    return this.chucNangService.update(Number(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chucNangService.remove(Number(id));
  }
}
