import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type MessageRole = 'user' | 'assistant' | 'system';
export type ConversationTier = 'L0' | 'L1' | 'L2';
export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'transferred';

@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  sessionId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  agentId: string;

  @Column({ type: 'varchar', length: 10, default: 'L1' })
  tier: ConversationTier;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: ConversationStatus;

  @Column({ type: 'text', nullable: true })
  escalationReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;
}

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  conversationId: string;

  @Column({ type: 'varchar', length: 20 })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  tier: ConversationTier;

  @Column({ type: 'varchar', length: 50, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  provider: string;

  @Column({ type: 'int', nullable: true })
  tokensUsed: number;

  @Column({ type: 'int', nullable: true })
  latencyMs: number;

  @CreateDateColumn()
  timestamp: Date;
}
