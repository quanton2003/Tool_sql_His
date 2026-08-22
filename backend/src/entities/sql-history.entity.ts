import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sql_history')
export class SqlHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  request: string;

  @Column('text')
  sql: string;

  @Column({ default: 'generated' })
  status: string;

  @Column({ default: 'read' })
  type: string;

  @Column({ nullable: true })
  executionTime: number;

  @Column({ nullable: true })
  rowCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
