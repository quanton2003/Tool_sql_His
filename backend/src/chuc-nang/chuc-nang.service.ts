import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChucNang } from '../entities/chuc-nang.entity';

@Injectable()
export class ChucNangService implements OnModuleInit {
  constructor(
    @InjectRepository(ChucNang)
    private readonly chucNangRepository: Repository<ChucNang>,
  ) {}

  async onModuleInit() {
    if (await this.chucNangRepository.count() > 0) return;
    const defaults = [
      ['Tra cứu thông tin bệnh nhân', 'Xem danh sách thông tin định danh bệnh nhân.', 'SELECT * FROM public.tb_hc_benhnhan LIMIT 100;'],
      ['Tra cứu hồ sơ khám bệnh', 'Xem các hồ sơ khám và thời điểm khám.', 'SELECT * FROM public.tb_medicalrecord ORDER BY medicalrecorddate DESC LIMIT 100;'],
      ['Tra cứu lịch sử điều trị', 'Xem các hồ sơ điều trị theo bệnh nhân.', 'SELECT * FROM public.tb_medicalrecord WHERE patientid = :patient_id ORDER BY medicalrecorddate DESC;'],
      ['Tra cứu giường bệnh', 'Xem tình trạng giường và phòng hiện tại.', 'SELECT * FROM public.tb_bed LIMIT 100;'],
      ['Tra cứu đối tượng bệnh nhân', 'Xem danh mục đối tượng thanh toán của bệnh nhân.', 'SELECT * FROM public.tb_dm_patientobject LIMIT 100;'],
      ['Tra cứu nhóm bệnh nhân', 'Xem danh mục nhóm bệnh nhân.', 'SELECT * FROM public.tb_dm_patientgroup LIMIT 100;'],
      ['Tra cứu kiểm tra BHYT', 'Xem lịch sử kiểm tra dữ liệu bảo hiểm y tế.', 'SELECT * FROM public.tb_bhyt_checkxml4750 ORDER BY ngaysu DESC LIMIT 100;'],
      ['Tra cứu loại ca khám', 'Xem danh mục loại ca khám.', 'SELECT * FROM public.tb_cakhambenh_loai LIMIT 100;'],
      ['Tra cứu dịch vụ khám bệnh', 'Xem danh mục dịch vụ khám bệnh.', 'SELECT * FROM public.tb_dmdc_servicekhambenh LIMIT 100;'],
      ['Đếm hồ sơ khám theo ngày', 'Thống kê số hồ sơ khám theo ngày khám.', 'SELECT medicalrecorddate::date AS ngay_kham, COUNT(*) AS so_luong FROM public.tb_medicalrecord GROUP BY medicalrecorddate::date ORDER BY ngay_kham DESC;'],
      ['Tìm bệnh nhân theo mã', 'Tìm hồ sơ theo patientid hoặc patientrecordid.', 'SELECT * FROM public.tb_hc_benhnhan WHERE patientid = :patient_id OR patientrecordid = :patient_record_id;'],
      ['Kiểm tra dữ liệu bảng', 'Xem nhanh số dòng và dữ liệu mẫu của bảng được chọn.', 'SELECT COUNT(*) AS so_dong FROM public.tb_hc_benhnhan;'],
    ];
    for (const [ten, moTa, sql] of defaults) {
      const exists = await this.chucNangRepository.findOne({ where: { ten } });
      if (!exists) await this.chucNangRepository.save(this.chucNangRepository.create({ ten, moTa, sql, trangThai: 'active' }));
    }
  }

  async findAll(search?: string) {
    const items = await this.chucNangRepository.find({ order: { createdAt: 'DESC' } });
    if (!search?.trim()) return items;
    const normalizedSearch = this.normalize(search);
    return items.filter((item) => [item.ten, item.moTa, item.sql || ''].some((value) => this.normalize(value).includes(normalizedSearch)));
  }

  private normalize(value: string) {
    return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
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
