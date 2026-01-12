import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type AgentStatus = 'online' | 'away' | 'busy' | 'offline';
export type QueueStatus = 'waiting' | 'assigned' | 'timeout';

@Entity('agents')
export class AgentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, default: 'offline' })
  status: AgentStatus;

  @Column('text', { array: true, default: [] })
  currentChats: string[];

  @Column({ type: 'int', default: 5 })
  maxConcurrentChats: number;

  @Column('text', { array: true, default: [] })
  skills: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;
}

@Entity('queue_entries')
export class QueueEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  conversationId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerId: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'varchar', length: 20, default: 'waiting' })
  status: QueueStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedAgentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;
}
