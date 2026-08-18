import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chuc_nangs')
export class ChucNang {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ten: string;

  @Column('text')
  moTa: string;

  @Column({ default: 'active' })
  trangThai: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
