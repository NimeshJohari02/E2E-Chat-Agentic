import { Test, TestingModule } from '@nestjs/testing';
import { AgentService } from './agent.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgentEntity, QueueEntryEntity } from './entities/agent.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * L2 Agent Service Unit Tests
 * Author: Quinn (QA Automation Lead)
 * PRD Reference: PRD-003 - L2 Agent Handoff System
 *
 * Test Coverage:
 * - TC-001: Agent login with valid credentials
 * - TC-002: Agent login rejected with invalid credentials
 * - TC-003: Agent status update
 * - TC-004: Add customer to queue
 * - TC-005: Get queue position
 * - TC-006: Assign next customer to agent
 * - TC-007: Agent at max capacity rejection
 * - TC-008: Empty queue returns null
 */

jest.mock('bcrypt');

describe('AgentService', () => {
  let service: AgentService;
  let agentRepo: jest.Mocked<Repository<AgentEntity>>;
  let queueRepo: jest.Mocked<Repository<QueueEntryEntity>>;

  const mockAgent: AgentEntity = {
    id: 'agent-123',
    email: 'agent@test.com',
    passwordHash: 'hashed_password',
    name: 'Test Agent',
    status: 'online',
    currentChats: [],
    maxConcurrentChats: 5,
    skills: ['general'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActiveAt: new Date(),
    lastLoginAt: new Date(),
  };

  const mockQueueEntry: QueueEntryEntity = {
    id: 'queue-123',
    conversationId: 'conv-456',
    customerId: 'customer-789',
    priority: 0,
    status: 'waiting',
    assignedAgentId: null,
    createdAt: new Date(),
    assignedAt: null,
  };

  beforeEach(async () => {
    const mockAgentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      manager: {
        transaction: jest.fn((cb) => cb({
          findOne: mockQueueRepo.findOne,
          save: mockQueueRepo.save,
        })),
      },
    };

    const mockQueueRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      manager: {
        transaction: jest.fn(async (cb) => {
          return cb({
            findOne: (entity: any) => {
              // Mock finding AgentEntity
              if (entity === AgentEntity) {
                return mockAgentRepo.findOne();
              }
              // Mock finding QueueEntryEntity
              return mockQueueRepo.findOne();
            },
            save: (entity: any) => {
               // Determine which repo to save to based on entity properties
               if (entity.email) return mockAgentRepo.save(entity);
               return mockQueueRepo.save(entity);
            },
          });
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        {
          provide: getRepositoryToken(AgentEntity),
          useValue: mockAgentRepo,
        },
        {
          provide: getRepositoryToken(QueueEntryEntity),
          useValue: mockQueueRepo,
        },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    agentRepo = module.get(getRepositoryToken(AgentEntity));
    queueRepo = module.get(getRepositoryToken(QueueEntryEntity));
  });

  describe('login()', () => {
    it('TC-001: should login with valid credentials', async () => {
      agentRepo.findOne.mockResolvedValue(mockAgent);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      agentRepo.save.mockResolvedValue({ ...mockAgent, status: 'online' });

      const result = await service.login({
        email: 'agent@test.com',
        password: 'correct_password',
      });

      expect(result.success).toBe(true);
      expect(result.agent).toBeDefined();
      expect(result.agent?.status).toBe('online');
    });

    it('TC-002: should reject invalid credentials', async () => {
      agentRepo.findOne.mockResolvedValue(mockAgent);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'agent@test.com',
          password: 'wrong_password',
        }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('TC-003: should reject non-existent agent', async () => {
      agentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@test.com',
          password: 'password',
        }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('updateStatus()', () => {
    it('TC-004: should update agent status to away', async () => {
      agentRepo.findOne.mockResolvedValue(mockAgent);
      agentRepo.save.mockResolvedValue({ ...mockAgent, status: 'away' });

      const result = await service.updateStatus('agent-123', { status: 'away' });

      expect(result.status).toBe('away');
    });
  });

  describe('Queue Management', () => {
    it('TC-005: should add customer to queue', async () => {
      queueRepo.create.mockReturnValue(mockQueueEntry);
      queueRepo.save.mockResolvedValue(mockQueueEntry);

      const result = await service.addToQueue('conv-456', 'customer-789');

      expect(result.conversationId).toBe('conv-456');
      expect(result.status).toBe('waiting');
    });

    it('TC-006: should return queue position', async () => {
      queueRepo.findOne.mockResolvedValue(mockQueueEntry);
      queueRepo.count.mockResolvedValue(3);

      const result = await service.getQueuePosition('conv-456');

      expect(result).not.toBeNull();
      expect(result?.position).toBe(3);
    });

    it('TC-007: should return null for non-existent queue entry', async () => {
      queueRepo.findOne.mockResolvedValue(null);

      const result = await service.getQueuePosition('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('assignNextToAgent()', () => {
    it('TC-008: should assign next customer to available agent', async () => {
      agentRepo.findOne.mockResolvedValue(mockAgent);
      queueRepo.findOne.mockResolvedValue(mockQueueEntry);
      queueRepo.save.mockResolvedValue({ ...mockQueueEntry, status: 'assigned' });
      agentRepo.save.mockResolvedValue(mockAgent);

      const result = await service.assignNextToAgent('agent-123');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('assigned');
    });

    it('TC-009: should reject when agent at max capacity', async () => {
      const busyAgent = { ...mockAgent, currentChats: ['1', '2', '3', '4', '5'] };
      agentRepo.findOne.mockResolvedValue(busyAgent);

      await expect(service.assignNextToAgent('agent-123')).rejects.toThrow(
        'maximum concurrent chats',
      );
    });

    it('TC-010: should return null when queue is empty', async () => {
      agentRepo.findOne.mockResolvedValue(mockAgent);
      queueRepo.findOne.mockResolvedValue(null);

      const result = await service.assignNextToAgent('agent-123');

      expect(result).toBeNull();
    });
  });

  describe('createAgent()', () => {
    it('TC-011: should create new agent with hashed password', async () => {
      agentRepo.findOne.mockResolvedValue(null); // No existing agent
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');
      agentRepo.create.mockReturnValue(mockAgent);
      agentRepo.save.mockResolvedValue(mockAgent);

      const result = await service.createAgent({
        email: 'new@test.com',
        password: 'password123',
        name: 'New Agent',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result.email).toBe('agent@test.com');
    });
  });
});
