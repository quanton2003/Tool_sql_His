import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Knowledge } from '../entities/knowledge.entity';
import { CompanyDatabaseService } from '../company-database/company-database.service';
import { CompanyDbSnapshot } from '../entities/company-db-snapshot.entity';
import { CompanyTable } from '../entities/company-table.entity';
import { CompanyColumn } from '../entities/company-column.entity';

@Injectable()
export class KnowledgeService implements OnModuleInit {
  constructor(
    @InjectRepository(Knowledge)
    private readonly knowledgeRepository: Repository<Knowledge>,
    @InjectRepository(CompanyDbSnapshot)
    private readonly snapshotRepository: Repository<CompanyDbSnapshot>,
    @InjectRepository(CompanyTable)
    private readonly tableRepository: Repository<CompanyTable>,
    @InjectRepository(CompanyColumn)
    private readonly columnRepository: Repository<CompanyColumn>,
    private readonly companyDatabaseService: CompanyDatabaseService,
  ) {}

  async resetAndRefreshFromSnapshot() {
    const snapshot = await this.snapshotRepository.findOne({ where: { status: 'success' }, order: { createdAt: 'DESC' } });
    if (!snapshot) throw new NotFoundException('Chưa có schema snapshot thành công.');
    const tables = await this.tableRepository.find({ where: { snapshotId: snapshot.id }, order: { tableName: 'ASC' } });
    const columns = await this.columnRepository
      .createQueryBuilder('column')
      .innerJoin(CompanyTable, 'table', 'table.id = column.tableId')
      .where('table.snapshotId = :snapshotId', { snapshotId: snapshot.id })
      .orderBy('column.id', 'ASC')
      .take(100)
      .getMany();
    const tableById = new Map(tables.map((table) => [table.id, table.tableName]));
    const unique = new Map<string, { tableName: string; columnName: string; dataType: string }>();
    for (const column of columns) {
      const tableName = tableById.get(column.tableId);
      if (tableName) unique.set(`${tableName}.${column.columnName}`, { tableName, columnName: column.columnName, dataType: column.dataType });
    }

    const priority = [
      ['tb_patient', 'patientid', 'Mã định danh duy nhất của bệnh nhân.'],
      ['tb_patient', 'patientcode', 'Mã bệnh nhân hiển thị trên hồ sơ.'],
      ['tb_patient', 'patientname', 'Họ và tên bệnh nhân.'],
      ['tb_patient', 'birthdayyear', 'Năm sinh bệnh nhân.'],
      ['tb_patient', 'birthdaymonth', 'Tháng sinh bệnh nhân.'],
      ['tb_patient', 'birthdayday', 'Ngày sinh bệnh nhân.'],
      ['tb_patient', 'dm_gioitinhid', 'Mã giới tính bệnh nhân.'],
      ['tb_patient', 'patientphone', 'Số điện thoại bệnh nhân.'],
      ['tb_patient', 'patientemail', 'Email bệnh nhân.'],
      ['tb_patient', 'patient_cmtnd', 'Số CMND/CCCD của bệnh nhân.'],
      ['tb_patient', 'cccd_sothe', 'Số căn cước công dân hoặc thẻ định danh.'],
      ['tb_patient', 'diachi', 'Địa chỉ cư trú của bệnh nhân.'],
      ['tb_patient', 'dm_tinhname', 'Tên tỉnh/thành phố cư trú.'],
      ['tb_patient', 'dm_huyenname', 'Tên quận/huyện cư trú.'],
      ['tb_patient', 'dm_xaname', 'Tên xã/phường cư trú.'],
      ['tb_patient', 'dm_dantocid', 'Mã dân tộc.'],
      ['tb_patient', 'dm_nghenghiepid', 'Mã nghề nghiệp.'],
      ['tb_patient', 'dm_bloodtypeid', 'Mã nhóm máu.'],
      ['tb_patient', 'diung', 'Thông tin dị ứng.'],
      ['tb_patient', 'tiensubenhbanthan', 'Tiền sử bệnh bản thân.'],
      ['tb_patient', 'tiensubenhgiadinh', 'Tiền sử bệnh gia đình.'],
      ['tb_patient', 'thekcb_so_the', 'Số thẻ khám chữa bệnh/BHYT.'],
      ['tb_patientrecord', 'patientrecordid', 'Mã lượt tiếp nhận hoặc hồ sơ khám.'],
      ['tb_patientrecord', 'patientid', 'Mã bệnh nhân liên kết lượt khám.'],
      ['tb_patientrecord', 'patientrecorddate', 'Ngày giờ tiếp nhận bệnh nhân.'],
      ['tb_patientrecord', 'sothutudenvien', 'Số thứ tự bệnh nhân đến viện.'],
      ['tb_patientrecord', 'madoituongkcb', 'Mã đối tượng khám chữa bệnh.'],
      ['tb_patientrecord', 'tuyen_benh_vien', 'Tuyến của bệnh viện.'],
      ['tb_patientrecord', 'chandoandenkham', 'Chẩn đoán khi bệnh nhân đến khám.'],
      ['tb_patientrecord', 'chandoandenkham_icd10', 'Mã ICD-10 chẩn đoán khi đến khám.'],
      ['tb_patientrecord', 'dm_patientrecordstatusid', 'Mã trạng thái lượt khám.'],
      ['tb_medicalrecord', 'medicalrecordid', 'Mã hồ sơ khám bệnh.'],
      ['tb_medicalrecord', 'patientrecordid', 'Mã lượt tiếp nhận liên kết hồ sơ khám.'],
      ['tb_medicalrecord', 'medicalrecorddate', 'Ngày giờ khám bệnh.'],
      ['tb_medicalrecord', 'departmentid', 'Mã khoa khám hoặc điều trị.'],
      ['tb_medicalrecord', 'roomid', 'Mã phòng khám hoặc điều trị.'],
      ['tb_medicalrecord', 'userid_batdaukham', 'Mã người dùng bắt đầu khám.'],
      ['tb_medicalrecord', 'chandoan', 'Chẩn đoán bệnh.'],
      ['tb_medicalrecord', 'chandoan_icd10', 'Mã ICD-10 của chẩn đoán.'],
      ['tb_medicalrecord', 'chandoan_kemtheo', 'Chẩn đoán bệnh kèm theo.'],
      ['tb_medicalrecord', 'chandoan_kemtheo_icd10', 'Mã ICD-10 bệnh kèm theo.'],
      ['tb_medicalrecord', 'lydokham', 'Lý do bệnh nhân đến khám.'],
      ['tb_medicalrecord', 'quatrinhbenhly', 'Quá trình bệnh lý.'],
      ['tb_medicalrecord', 'tomtatketquacls', 'Tóm tắt kết quả cận lâm sàng.'],
      ['tb_medicalrecord', 'phuongphapdieutri', 'Phương pháp điều trị.'],
      ['tb_medicalrecord', 'tinhtrangbenhnhan', 'Tình trạng bệnh nhân.'],
      ['tb_medicalrecord', 'huongdieutri', 'Hướng điều trị tiếp theo.'],
      ['tb_medicalrecord', 'ngayhen', 'Ngày hẹn tái khám.'],
      ['tb_medicalrecord', 'ngaytaikham', 'Ngày tái khám.'],
      ['tb_department', 'departmentid', 'Mã khoa/phòng ban.'],
      ['tb_department', 'departmentcode', 'Mã khoa/phòng ban hiển thị.'],
      ['tb_department', 'departmentname', 'Tên khoa/phòng ban.'],
      ['tb_room', 'roomid', 'Mã phòng.'],
      ['tb_room', 'roomcode', 'Mã phòng hiển thị.'],
      ['tb_room', 'roomname', 'Tên phòng.'],
      ['tb_bhyt_checkxml4750', 'patientrecordid', 'Mã lượt khám dùng kiểm tra BHYT.'],
      ['tb_bhyt_checkxml4750', 'ngaysu', 'Ngày giờ kiểm tra BHYT.'],
    ];
    const priorityMap = new Map(priority.map(([tableName, columnName, meaning]) => [`${tableName}.${columnName}`, meaning]));
    const priorityColumns = priority
      .map(([tableName, columnName]) => unique.get(`${tableName}.${columnName}`))
      .filter((column): column is { tableName: string; columnName: string; dataType: string } => Boolean(column));
    const excluded = /(^|_)(temp|log|cache|hash|json|image|token|device)(_|$)/i;
    const fallbackColumns = Array.from(unique.values()).filter((column) => !excluded.test(`${column.tableName}_${column.columnName}`));
    const selectedColumns = priorityColumns.length > 0
      ? priorityColumns
      : fallbackColumns.slice(0, 100);

    const client = await this.companyDatabaseService.getClient();
    const refreshed: Array<{ tableName: string; columnName: string; meaning: string; exampleValue: string; status: string }> = [];
    try {
      for (const column of selectedColumns) {
        const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
        let exampleValue = 'Không có dữ liệu';
        try {
          const result = await client.query(`SELECT ${quote(column.columnName)} AS value FROM ${quote(snapshot.schemaName)}.${quote(column.tableName)} WHERE ${quote(column.columnName)} IS NOT NULL LIMIT 1`);
          if (result.rows[0]?.value !== undefined) exampleValue = String(result.rows[0].value);
        } catch {
          exampleValue = `Kiểu ${column.dataType}`;
        }
        refreshed.push({ tableName: column.tableName, columnName: column.columnName, meaning: priorityMap.get(`${column.tableName}.${column.columnName}`) || `Trường ${column.columnName} của bảng ${column.tableName}.`, exampleValue, status: 'suggested' });
      }
    } finally {
      client.release();
    }

    await this.knowledgeRepository.clear();
    await this.knowledgeRepository.save(refreshed);
    return { total: refreshed.length, source: `${snapshot.schemaName} schema snapshot`, localOnly: true };
  }

  async onModuleInit() {
    const defaults = [
      ['tb_hc_benhnhan', 'patientid', 'Mã định danh bệnh nhân dùng để liên kết các hồ sơ nghiệp vụ.', 'confirmed'],
      ['tb_hc_benhnhan', 'patientrecordid', 'Mã lượt hoặc hồ sơ tiếp nhận của bệnh nhân.', 'confirmed'],
      ['tb_hc_benhnhan', 'hc_benhnhanid', 'Khóa chính của bản ghi thông tin bệnh nhân.', 'confirmed'],
      ['tb_hc_benhnhan', 'medicalrecordid', 'Mã hồ sơ khám liên quan đến thông tin bệnh nhân.', 'suggested'],
      ['tb_hc_benhnhan', 'ketluanbenhnhan', 'Kết luận ghi nhận trong hồ sơ bệnh nhân.', 'suggested'],
      ['tb_medicalrecord', 'medicalrecordid', 'Khóa chính của hồ sơ khám bệnh.', 'confirmed'],
      ['tb_medicalrecord', 'patientrecordid', 'Liên kết hồ sơ khám với lượt tiếp nhận bệnh nhân.', 'confirmed'],
      ['tb_medicalrecord', 'medicalrecorddate', 'Ngày giờ phát sinh hồ sơ khám bệnh.', 'confirmed'],
      ['tb_medicalrecord', 'departmentid', 'Khoa thực hiện hoặc tiếp nhận hồ sơ khám.', 'suggested'],
      ['tb_medicalrecord', 'roomid', 'Phòng thực hiện hoạt động khám.', 'suggested'],
      ['tb_medicalrecord', 'dm_medicalrecordtypeid', 'Loại hồ sơ khám bệnh.', 'suggested'],
      ['tb_medicalrecord', 'dm_medicalrecordstatusid', 'Trạng thái xử lý của hồ sơ khám.', 'suggested'],
      ['tb_bed', 'bedid', 'Mã giường bệnh.', 'confirmed'],
      ['tb_bed', 'roomid', 'Mã phòng chứa giường bệnh.', 'suggested'],
      ['tb_bed', 'departmentid', 'Mã khoa quản lý giường.', 'suggested'],
      ['tb_dm_patientobject', 'dm_patientobjectid', 'Mã đối tượng bệnh nhân hoặc nhóm thanh toán.', 'confirmed'],
      ['tb_dm_patientgroup', 'dm_patientgroupid', 'Mã nhóm bệnh nhân.', 'suggested'],
      ['tb_bhyt_checkxml4750', 'patientrecordid', 'Hồ sơ tiếp nhận dùng để đối chiếu dữ liệu BHYT.', 'confirmed'],
      ['tb_bhyt_checkxml4750', 'ngaysu', 'Thời điểm thực hiện kiểm tra dữ liệu BHYT.', 'suggested'],
      ['tb_cakhambenh_loai', 'tenloaica', 'Tên loại ca khám.', 'confirmed'],
      ['tb_dmdc_servicekhambenh', 'dmdc_servicekhambenhid', 'Mã dịch vụ khám bệnh trong danh mục.', 'suggested'],
    ];
    for (const [tableName, columnName, meaning, status] of defaults) {
      const exists = await this.knowledgeRepository.findOne({ where: { tableName, columnName } });
      if (!exists) await this.knowledgeRepository.save(this.knowledgeRepository.create({ tableName, columnName, meaning, status }));
    }
    const examples: Record<string, string> = {
      'tb_hc_benhnhan.patientid': 'BN001',
      'tb_hc_benhnhan.patientrecordid': 'HS202600001',
      'tb_hc_benhnhan.hc_benhnhanid': '10001',
      'tb_hc_benhnhan.medicalrecordid': '20001',
      'tb_hc_benhnhan.ketluanbenhnhan': 'Theo dõi ngoại trú',
      'tb_medicalrecord.medicalrecordid': '20001',
      'tb_medicalrecord.patientrecordid': 'HS202600001',
      'tb_medicalrecord.medicalrecorddate': '2026-08-22 08:30:00',
      'tb_medicalrecord.departmentid': '12',
      'tb_medicalrecord.roomid': '305',
      'tb_medicalrecord.dm_medicalrecordtypeid': '1',
      'tb_medicalrecord.dm_medicalrecordstatusid': '2',
      'tb_bed.bedid': '501',
      'tb_bed.roomid': '305',
      'tb_bed.departmentid': '12',
      'tb_dm_patientobject.dm_patientobjectid': '1',
      'tb_dm_patientgroup.dm_patientgroupid': '3',
      'tb_bhyt_checkxml4750.patientrecordid': 'HS202600001',
      'tb_bhyt_checkxml4750.ngaysu': '2026-08-22 09:00:00',
      'tb_cakhambenh_loai.tenloaica': 'Khám thường',
      'tb_dmdc_servicekhambenh.dmdc_servicekhambenhid': 'DV001',
    };
    for (const [key, exampleValue] of Object.entries(examples)) {
      const [tableName, columnName] = key.split('.');
      const item = await this.knowledgeRepository.findOne({ where: { tableName, columnName } });
      if (item) await this.knowledgeRepository.update(item.id, { exampleValue });
    }
  }

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

  async create(data: { tableName: string; columnName: string; meaning: string; value?: string; exampleValue?: string; status: string }) {
    const item = this.knowledgeRepository.create(data);
    return this.knowledgeRepository.save(item);
  }

  async update(id: number, data: { tableName?: string; columnName?: string; meaning?: string; value?: string; exampleValue?: string; status?: string }) {
    await this.knowledgeRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const result = await this.knowledgeRepository.delete(id);
    return (result.affected || 0) > 0;
  }
}
