import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('company_db_snapshots')
export class CompanyDbSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  databaseName: string;

  @Column()
  schemaName: string;

  @Column()
  tableCount: number;

  @Column()
  columnCount: number;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;
}
