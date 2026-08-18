import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyDbSnapshot } from './company-db-snapshot.entity';
import { CompanySchema } from './company-schema.entity';

@Entity('company_tables')
export class CompanyTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  snapshotId: number;

  @Column()
  schemaId: number;

  @Column()
  tableName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  tableType: string;

  @ManyToOne(() => CompanyDbSnapshot)
  @JoinColumn({ name: 'snapshotId' })
  snapshot: CompanyDbSnapshot;

  @ManyToOne(() => CompanySchema)
  @JoinColumn({ name: 'schemaId' })
  schema: CompanySchema;
}
