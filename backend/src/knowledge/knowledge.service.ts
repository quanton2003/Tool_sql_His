import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Knowledge } from '../entities/knowledge.entity';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(Knowledge)
    private readonly knowledgeRepository: Repository<Knowledge>,
  ) {}

  async findAll(tableName?: string) {
    const query = this.knowledgeRepository.createQueryBuilder('k');
    if (tableName) {
      query.where('k.tableName = :tableName', { tableName });
    }
    query.orderBy('k.createdAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: number) {
    const item = await this.knowledgeRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Knowledge không tồn tại');
    return item;
  }

  async create(data: { tableName: string; columnName: string; meaning: string; value?: string; status: string }) {
    const item = this.knowledgeRepository.create(data);
    return this.knowledgeRepository.save(item);
  }

  async update(id: number, data: { tableName?: string; columnName?: string; meaning?: string; value?: string; status?: string }) {
    await this.knowledgeRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.knowledgeRepository.delete(id);
    return (result.affected || 0) > 0;
  }
}
