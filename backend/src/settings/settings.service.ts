import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async findAll() {
    const settings = await this.settingRepository.find();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async findOne(key: string) {
    const setting = await this.settingRepository.findOne({ where: { key } });
    return setting?.value || null;
  }

  async create(key: string, value: string) {
    const setting = this.settingRepository.create({ key, value });
    return this.settingRepository.save(setting);
  }

  async update(key: string, value: string) {
    await this.settingRepository.update({ key }, { value });
    return this.findOne(key);
  }
}
