import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('session_metrics')
export class SessionMetricsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  conversationId: string;

  @Column({ type: 'uuid' })
  @Index()
  agentId: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date;

  // Time tracking (in seconds)
  @Column({ type: 'int', default: 0 })
  firstResponseTime: number;

  @Column({ type: 'int', default: 0 })
  totalHandleTime: number;

  @Column({ type: 'int', default: 0 })
  activeTypingTime: number;

  @Column({ type: 'int', default: 0 })
  idleTime: number;

  @Column({ type: 'int', default: 0 })
  customerWaitTime: number;

  // Outcomes
  @Column({ type: 'varchar', length: 20, default: 'active' })
  resolution: 'active' | 'resolved' | 'transferred' | 'abandoned';

  @Column({ type: 'uuid', nullable: true })
  transferredTo: string;

  @Column({ type: 'int', nullable: true })
  csatScore: number;

  // Metadata
  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @Column({ type: 'varchar', length: 10, default: 'L2' })
  tier: 'L0' | 'L1' | 'L2';
}

@Entity('daily_agent_summaries')
export class DailyAgentSummaryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  agentId: string;

  @Column({ type: 'date' })
  @Index()
  date: Date;

  // Aggregates
  @Column({ type: 'int', default: 0 })
  totalConversations: number;

  @Column({ type: 'int', default: 0 })
  totalHandleTime: number;

  @Column({ type: 'float', default: 0 })
  avgFirstResponseTime: number;

  @Column({ type: 'float', default: 0 })
  avgHandleTime: number;

  @Column({ type: 'float', default: 0 })
  utilizationRate: number;

  @Column({ type: 'int', default: 0 })
  resolvedCount: number;

  @Column({ type: 'int', default: 0 })
  transferredCount: number;

  @Column({ type: 'float', nullable: true })
  avgCsat: number;

  // Shift details
  @Column({ type: 'int', default: 0 })
  onlineTime: number;

  @Column({ type: 'int', default: 0 })
  awayTime: number;

  @Column({ type: 'int', default: 0 })
  busyTime: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('report_configs')
export class ReportConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column('text', { array: true })
  recipients: string[];

  @Column({ type: 'varchar', length: 50, default: '0 9 * * *' })
  schedule: string; // Cron expression

  @Column({ type: 'varchar', length: 10, default: 'both' })
  format: 'html' | 'csv' | 'both';

  @Column('text', { array: true, default: [] })
  metrics: string[];

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  timezone: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
