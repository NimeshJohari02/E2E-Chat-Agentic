import { Test, TestingModule } from '@nestjs/testing';
import { AgentService } from './agent.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgentEntity, QueueEntryEntity } from './entities/agent.entity';
import { DataSource, EntityManager } from 'typeorm';

describe('AgentService - Race Condition Verification', () => {
  let service: AgentService;
  let dataSource: DataSource;
  let mockManager: Partial<EntityManager>;

  beforeEach(async () => {
    // Mock Transaction Manager
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    // Mock DataSource
    const mockDataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(mockManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        {
          provide: getRepositoryToken(AgentEntity),
          useValue: {}, // Not used directly in new method
        },
        {
          provide: getRepositoryToken(QueueEntryEntity),
          useValue: {}, // Not used directly in new method
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
    dataSource = module.get<DataSource>(DataSource);
  });

  describe('assignNextToAgent', () => {
    it('BUG-001: should use PESSIMISTIC_WRITE lock inside a transaction', async () => {
      // Setup Data
      const mockAgent = {
        id: 'agent-1',
        email: 'agent@test.com',
        currentChats: [],
        maxConcurrentChats: 5,
      };

      const mockEntry = {
        id: 'queue-1',
        status: 'waiting',
        conversationId: 'conv-123',
      };

      // Mock Manager behaviors
      (mockManager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockAgent) // First findOne: Agent
        .mockResolvedValueOnce(mockEntry); // Second findOne: Queue Entry

      // Execute
      await service.assignNextToAgent('agent-1');

      // VERIFICATION 1: Must be in a transaction
      expect(dataSource.transaction).toHaveBeenCalled();

      // VERIFICATION 2: Agent fetch must have lock
      expect(mockManager.findOne).toHaveBeenCalledWith(
        AgentEntity,
        expect.objectContaining({
          where: { id: 'agent-1' },
          lock: { mode: 'pessimistic_write' },
        }),
      );

      // VERIFICATION 3: Queue Fetch must have lock (The Critical Fix)
      expect(mockManager.findOne).toHaveBeenCalledWith(
        QueueEntryEntity,
        expect.objectContaining({
          where: { status: 'waiting' },
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });

    it('should rollback/throw if agent fetch fails', async () => {
      (mockManager.findOne as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.assignNextToAgent('invalid')).rejects.toThrow();
    });
  });
});
