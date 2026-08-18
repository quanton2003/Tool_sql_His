import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyTable } from './company-table.entity';

@Entity('company_indexes')
export class CompanyIndex {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tableId: number;

  @Column()
  indexName: string;

  @Column()
  columnName: string;

  @Column({ default: false })
  isUnique: boolean;

  @ManyToOne(() => CompanyTable)
  @JoinColumn({ name: 'tableId' })
  table: CompanyTable;
}
