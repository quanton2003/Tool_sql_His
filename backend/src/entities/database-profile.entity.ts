import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('database_profiles')
export class DatabaseProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  host: string;

  @Column({ default: 5432 })
  port: number;

  @Column()
  database: string;

  @Column()
  username: string;

  @Column('text', { default: '' })
  password: string;

  @Column({ default: 'public' })
  schema: string;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
