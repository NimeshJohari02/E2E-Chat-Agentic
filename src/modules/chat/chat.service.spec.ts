import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationEntity, MessageEntity } from './entities/chat.entity';
import { ModelProviderFactory } from './providers';
import { Repository } from 'typeorm';

/**
 * L1 Chat Service Unit Tests
 * Author: Quinn (QA Automation Lead)
 * PRD Reference: PRD-002 - L1 AI Chatbot with Model Routing
 *
 * Test Coverage:
 * - TC-001: New session created when sessionId not provided
 * - TC-002: Existing session retrieved when sessionId provided
 * - TC-003: User message saved to database
 * - TC-004: AI response generated and saved
 * - TC-005: Escalation triggered on "talk to human"
 * - TC-006: Escalation triggered on "speak to agent"
 * - TC-007: Model fallback when primary unavailable
 */

describe('ChatService', () => {
  let service: ChatService;
  let conversationRepo: jest.Mocked<Repository<ConversationEntity>>;
  let messageRepo: jest.Mocked<Repository<MessageEntity>>;
  let providerFactory: jest.Mocked<ModelProviderFactory>;

  const mockConversation: ConversationEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    sessionId: 'session-123',
    customerId: 'customer-456',
    agentId: null,
    tier: 'L1',
    status: 'active',
    escalationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    resolvedAt: null,
  };

  const mockAIResponse = {
    content: 'I can help you with that!',
    tokensUsed: { prompt: 10, completion: 20, total: 30 },
    model: 'llama2',
    provider: 'ollama',
    latencyMs: 500,
  };

  beforeEach(async () => {
    const mockConversationRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockMessageRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockProviderFactory = {
      getHealthyProvider: jest.fn().mockResolvedValue({
        name: 'ollama',
        generateResponse: jest.fn().mockResolvedValue(mockAIResponse),
        healthCheck: jest.fn().mockResolvedValue(true),
      }),
      getActiveProvider: jest.fn().mockReturnValue({ name: 'ollama' }),
      getAllProviderHealth: jest.fn().mockResolvedValue({
        ollama: true,
        openai: false,
        anthropic: false,
      }),
      switchProvider: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ConversationEntity),
          useValue: mockConversationRepo,
        },
        {
          provide: getRepositoryToken(MessageEntity),
          useValue: mockMessageRepo,
        },
        {
          provide: ModelProviderFactory,
          useValue: mockProviderFactory,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    conversationRepo = module.get(getRepositoryToken(ConversationEntity));
    messageRepo = module.get(getRepositoryToken(MessageEntity));
    providerFactory = module.get(ModelProviderFactory);
  });

  describe('sendMessage()', () => {
    it('TC-001: should create new session when sessionId not provided', async () => {
      conversationRepo.findOne.mockResolvedValue(null);
      conversationRepo.create.mockReturnValue(mockConversation);
      conversationRepo.save.mockResolvedValue(mockConversation);
      messageRepo.create.mockReturnValue({} as MessageEntity);
      messageRepo.save.mockResolvedValue({} as MessageEntity);
      messageRepo.find.mockResolvedValue([]);

      const result = await service.sendMessage({
        message: 'Hello',
        customerId: 'customer-456',
      });

      expect(result.sessionId).toBeDefined();
      expect(conversationRepo.create).toHaveBeenCalled();
    });

    it('TC-002: should use existing session when sessionId provided', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.create.mockReturnValue({} as MessageEntity);
      messageRepo.save.mockResolvedValue({} as MessageEntity);
      messageRepo.find.mockResolvedValue([]);

      const result = await service.sendMessage({
        message: 'Hello',
        sessionId: 'session-123',
      });

      expect(result.sessionId).toBe('session-123');
      expect(conversationRepo.create).not.toHaveBeenCalled();
    });

    it('TC-003: should save user message to database', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.create.mockReturnValue({} as MessageEntity);
      messageRepo.save.mockResolvedValue({} as MessageEntity);
      messageRepo.find.mockResolvedValue([]);

      await service.sendMessage({
        message: 'Test message',
        sessionId: 'session-123',
      });

      expect(messageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Test message',
        }),
      );
    });

    it('TC-004: should generate AI response and save to database', async () => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      messageRepo.create.mockReturnValue({} as MessageEntity);
      messageRepo.save.mockResolvedValue({} as MessageEntity);
      messageRepo.find.mockResolvedValue([]);

      const result = await service.sendMessage({
        message: 'Hello',
        sessionId: 'session-123',
      });

      expect(result.message.content).toBe('I can help you with that!');
      expect(result.provider).toBe('ollama');
      expect(result.tokensUsed).toBe(30);
    });
  });

  describe('Escalation Detection', () => {
    beforeEach(() => {
      conversationRepo.findOne.mockResolvedValue(mockConversation);
      conversationRepo.save.mockResolvedValue(mockConversation);
    });

    it('TC-005: should escalate on "talk to human"', async () => {
      const result = await service.sendMessage({
        message: 'I want to talk to human',
        sessionId: 'session-123',
      });

      expect(result).toMatchObject({
        success: true,
        tier: 'L2',
      });
    });

    it('TC-006: should escalate on "speak to agent"', async () => {
      const result = await service.sendMessage({
        message: 'please speak to agent',
        sessionId: 'session-123',
      });

      expect(result).toMatchObject({
        success: true,
        tier: 'L2',
      });
    });

    it('TC-007: should escalate on "customer service"', async () => {
      const result = await service.sendMessage({
        message: 'I need customer service',
        sessionId: 'session-123',
      });

      expect(result).toMatchObject({
        success: true,
        tier: 'L2',
      });
    });
  });

  describe('getModelHealth()', () => {
    it('TC-008: should return health status of all providers', async () => {
      const result = await service.getModelHealth();

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ provider: 'ollama', isHealthy: true }),
        ]),
      );
    });
  });

  describe('getConversationHistory()', () => {
    it('TC-009: should return null for non-existent session', async () => {
      conversationRepo.findOne.mockResolvedValue(null);

      const result = await service.getConversationHistory('non-existent');

      expect(result).toBeNull();
    });
  });
});
