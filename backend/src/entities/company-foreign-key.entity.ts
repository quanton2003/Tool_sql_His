import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyTable } from './company-table.entity';

@Entity('company_foreign_keys')
export class CompanyForeignKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tableId: number;

  @Column()
  columnName: string;

  @Column()
  foreignTableName: string;

  @Column()
  foreignColumnName: string;

  @ManyToOne(() => CompanyTable)
  @JoinColumn({ name: 'tableId' })
  table: CompanyTable;
}
