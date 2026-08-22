import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChucNang } from '../entities/chuc-nang.entity';

@Injectable()
export class ChucNangService {
  constructor(
    @InjectRepository(ChucNang)
    private readonly chucNangRepository: Repository<ChucNang>,
  ) {}

  async findAll(search?: string) {
    const query = this.chucNangRepository.createQueryBuilder('c');
    if (search) {
      query.where('LOWER(c.ten) LIKE LOWER(:search)', { search: `%${search}%` });
    }
    query.orderBy('c.createdAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: number) {
    const item = await this.chucNangRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Chức năng không tồn tại');
    return item;
  }

  async create(data: { ten: string; moTa: string; trangThai: string; sql?: string }) {
    const item = this.chucNangRepository.create(data);
    return this.chucNangRepository.save(item);
  }

  async update(id: number, data: { ten?: string; moTa?: string; trangThai?: string; sql?: string }) {
    await this.chucNangRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.chucNangRepository.delete(id);
    return (result.affected || 0) > 0;
  }
}
