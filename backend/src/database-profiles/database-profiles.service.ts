import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseProfile } from '../entities/database-profile.entity';
import { CompanyDatabaseService } from '../company-database/company-database.service';
import { SettingsService } from '../settings/settings.service';

export type DatabaseProfileInput = Omit<DatabaseProfile, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class DatabaseProfilesService {
  constructor(
    @InjectRepository(DatabaseProfile)
    private readonly repository: Repository<DatabaseProfile>,
    private readonly companyDatabaseService: CompanyDatabaseService,
    private readonly settingsService: SettingsService,
  ) {}

  findAll() {
    return this.repository.find({ order: { isActive: 'DESC', name: 'ASC' } });
  }

  async create(data: DatabaseProfileInput) {
    const profile = this.repository.create({ ...data, port: Number(data.port) || 5432 });
    return this.repository.save(profile);
  }

  async update(id: number, data: Partial<DatabaseProfileInput>) {
    const profile = await this.repository.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Database profile không tồn tại');
    Object.assign(profile, data, data.port === undefined ? {} : { port: Number(data.port) || 5432 });
    return this.repository.save(profile);
  }

  async remove(id: number) {
    const result = await this.repository.delete(id);
    return { deleted: (result.affected || 0) > 0 };
  }

  async activate(id: number) {
    const profile = await this.repository.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Database profile không tồn tại');
    await this.repository.update({ isActive: true }, { isActive: false });
    profile.isActive = true;
    await this.repository.save(profile);
    await Promise.all([
      this.settingsService.update('HIS_DB_HOST', profile.host),
      this.settingsService.update('HIS_DB_PORT', String(profile.port)),
      this.settingsService.update('HIS_DB_NAME', profile.database),
      this.settingsService.update('HIS_DB_USER', profile.username),
      this.settingsService.update('HIS_DB_PASSWORD', profile.password),
      this.settingsService.update('HIS_DB_SCHEMA', profile.schema),
    ]);
    await this.companyDatabaseService.reload();
    return profile;
  }
}
