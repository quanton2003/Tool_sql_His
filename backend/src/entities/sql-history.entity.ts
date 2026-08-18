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

  @CreateDateColumn()
  createdAt: Date;
}
