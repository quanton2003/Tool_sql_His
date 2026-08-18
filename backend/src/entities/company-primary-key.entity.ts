import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyTable } from './company-table.entity';

@Entity('company_primary_keys')
export class CompanyPrimaryKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tableId: number;

  @Column()
  columnName: string;

  @ManyToOne(() => CompanyTable)
  @JoinColumn({ name: 'tableId' })
  table: CompanyTable;
}
