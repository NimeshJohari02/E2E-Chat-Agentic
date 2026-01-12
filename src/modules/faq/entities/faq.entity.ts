import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('faqs')
export class FaqEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  @Index()
  question: string;

  @Column('text', { array: true, default: [] })
  variations: string[];

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  category: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Vector embedding for semantic search (pgvector)
  // @Column({ type: 'vector', nullable: true })
  // embedding: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
