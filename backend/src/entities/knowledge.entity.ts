import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('knowledges')
export class Knowledge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tableName: string;

  @Column()
  columnName: string;

  @Column('text')
  meaning: string;

  @Column('text', { nullable: true })
  value: string;

  @Column('text', { nullable: true })
  exampleValue: string;

  @Column({ default: 'suggested' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
