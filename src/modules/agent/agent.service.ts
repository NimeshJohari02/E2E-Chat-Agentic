import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AgentEntity, QueueEntryEntity } from './entities/agent.entity';
import {
  AgentLoginDto,
  CreateAgentDto,
  UpdateAgentStatusDto,
  AgentResponseDto,
  LoginResponseDto,
  QueueStatusDto,
  QueuePositionDto,
} from './dto/agent.dto';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepo: Repository<AgentEntity>,
    @InjectRepository(QueueEntryEntity)
    private readonly queueRepo: Repository<QueueEntryEntity>,
  ) {}

  // ============================================
  // Agent Authentication
  // ============================================

  async login(dto: AgentLoginDto): Promise<LoginResponseDto> {
    const agent = await this.agentRepo.findOne({
      where: { email: dto.email, isActive: true },
    });

    if (!agent) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(dto.password, agent.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login and set online
    agent.lastLoginAt = new Date();
    agent.lastActiveAt = new Date();
    agent.status = 'online';
    await this.agentRepo.save(agent);

    this.logger.log(`Agent ${agent.email} logged in`);

    return {
      success: true,
      agent: this.toAgentResponse(agent),
      // TODO: Implement JWT token
      token: `temp-token-${agent.id}`,
    };
  }

  async logout(agentId: string): Promise<void> {
    const agent = await this.findAgentById(agentId);
    agent.status = 'offline';
    agent.lastActiveAt = new Date();
    await this.agentRepo.save(agent);
    this.logger.log(`Agent ${agent.email} logged out`);
  }

  async updateStatus(agentId: string, dto: UpdateAgentStatusDto): Promise<AgentResponseDto> {
    const agent = await this.findAgentById(agentId);
    agent.status = dto.status;
    agent.lastActiveAt = new Date();
    await this.agentRepo.save(agent);
    this.logger.log(`Agent ${agent.email} status changed to ${dto.status}`);
    return this.toAgentResponse(agent);
  }

  // ============================================
  // Queue Management
  // ============================================

  async addToQueue(conversationId: string, customerId?: string, priority = 0): Promise<QueueEntryEntity> {
    const entry = this.queueRepo.create({
      conversationId,
      customerId,
      priority,
      status: 'waiting',
    });
    await this.queueRepo.save(entry);
    this.logger.log(`Conversation ${conversationId} added to queue`);
    return entry;
  }

  async getQueuePosition(conversationId: string): Promise<QueuePositionDto | null> {
    const entry = await this.queueRepo.findOne({
      where: { conversationId, status: 'waiting' },
    });

    if (!entry) {
      return null;
    }

    // Count entries ahead in queue
    const position = await this.queueRepo.count({
      where: { status: 'waiting' },
    });

    const avgWaitPerPosition = 2; // minutes
    const estimatedMinutes = position * avgWaitPerPosition;

    return {
      conversationId,
      position,
      estimatedWait: `${estimatedMinutes} minutes`,
    };
  }

  async getQueueStatus(): Promise<QueueStatusDto> {
    const waitingEntries = await this.queueRepo.find({
      where: { status: 'waiting' },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });

    const onlineAgents = await this.agentRepo.count({
      where: { status: 'online', isActive: true },
    });

    const now = new Date();
    const entries = waitingEntries.map((entry, index) => ({
      id: entry.id,
      conversationId: entry.conversationId,
      position: index + 1,
      waitTime: Math.round((now.getTime() - entry.createdAt.getTime()) / 1000 / 60),
    }));

    const totalWaitTime = entries.reduce((sum, e) => sum + e.waitTime, 0);

    return {
      totalWaiting: entries.length,
      avgWaitTime: entries.length > 0 ? totalWaitTime / entries.length : 0,
      onlineAgents,
      entries,
    };
  }

  // FIXED: Transactional assignment to prevent Race Condition (BUG-001)
  async assignNextToAgent(agentId: string): Promise<QueueEntryEntity | null> {
    // Use a transaction to safely pick the next item without race conditions
    return await this.queueRepo.manager.transaction(async (transactionalEntityManager) => {
      // Re-fetch agent inside transaction with lock to ensure currentChats is fresh
      const agent = await transactionalEntityManager.findOne(AgentEntity, {
        where: { id: agentId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!agent) {
        throw new NotFoundException(`Agent with id ${agentId} not found`);
      }

      // Check if agent can take more chats
      if (agent.currentChats.length >= agent.maxConcurrentChats) {
        throw new Error('Agent has reached maximum concurrent chats');
      }

      // Lock the row for update (skip locked rows so we don't block other agents, or just wait)
      // pessimistic_write == SELECT ... FOR UPDATE
      const nextEntry = await transactionalEntityManager.findOne(QueueEntryEntity, {
        where: { status: 'waiting' },
        order: { priority: 'DESC', createdAt: 'ASC' },
        lock: { mode: 'pessimistic_write' },
      });

      if (!nextEntry) {
        return null;
      }

      // Assign to agent
      nextEntry.status = 'assigned';
      nextEntry.assignedAgentId = agentId;
      nextEntry.assignedAt = new Date();
      await transactionalEntityManager.save(nextEntry);

      // Update agent's current chats
      agent.currentChats.push(nextEntry.conversationId);
      agent.status = 'busy';
      agent.lastActiveAt = new Date();
      await transactionalEntityManager.save(agent);

      this.logger.log(`Conversation ${nextEntry.conversationId} assigned to agent ${agent.email}`);
      return nextEntry;
    });
  }

  // ============================================
  // Agent CRUD
  // ============================================

  async createAgent(dto: CreateAgentDto): Promise<AgentResponseDto> {
    const existingAgent = await this.agentRepo.findOne({
      where: { email: dto.email },
    });

    if (existingAgent) {
      throw new Error('Agent with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const agent = this.agentRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      skills: dto.skills || [],
      maxConcurrentChats: dto.maxConcurrentChats || 5,
    });

    await this.agentRepo.save(agent);
    this.logger.log(`Created agent: ${agent.email}`);

    return this.toAgentResponse(agent);
  }

  async findAllAgents(): Promise<AgentResponseDto[]> {
    const agents = await this.agentRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return agents.map(this.toAgentResponse);
  }

  async getOnlineAgents(): Promise<AgentResponseDto[]> {
    const agents = await this.agentRepo.find({
      where: { status: 'online', isActive: true },
    });
    return agents.map(this.toAgentResponse);
  }

  private async findAgentById(id: string): Promise<AgentEntity> {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(`Agent with id ${id} not found`);
    }
    return agent;
  }

  private toAgentResponse(agent: AgentEntity): AgentResponseDto {
    return {
      id: agent.id,
      email: agent.email,
      name: agent.name,
      status: agent.status,
      currentChats: agent.currentChats,
      maxConcurrentChats: agent.maxConcurrentChats,
      skills: agent.skills,
      lastActiveAt: agent.lastActiveAt,
    };
  }
}
