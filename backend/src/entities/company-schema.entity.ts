import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyDbSnapshot } from './company-db-snapshot.entity';

@Entity('company_schemas')
export class CompanySchema {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  snapshotId: number;

  @Column()
  schemaName: string;

  @ManyToOne(() => CompanyDbSnapshot)
  @JoinColumn({ name: 'snapshotId' })
  snapshot: CompanyDbSnapshot;
}
