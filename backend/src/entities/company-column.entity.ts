import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyTable } from './company-table.entity';

@Entity('company_columns')
export class CompanyColumn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tableId: number;

  @Column()
  columnName: string;

  @Column()
  dataType: string;

  @Column()
  isNullable: string;

  @Column({ nullable: true })
  columnDefault: string;

  @Column({ default: false })
  isPrimaryKey: boolean;

  @Column({ nullable: true })
  foreignKey: string;

  @ManyToOne(() => CompanyTable)
  @JoinColumn({ name: 'tableId' })
  table: CompanyTable;
}
