import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChucNangController } from './chuc-nang.controller';
import { ChucNangService } from './chuc-nang.service';
import { ChucNang } from '../entities/chuc-nang.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChucNang])],
  controllers: [ChucNangController],
  providers: [ChucNangService],
  exports: [ChucNangService],
})
export class ChucNangModule {}
