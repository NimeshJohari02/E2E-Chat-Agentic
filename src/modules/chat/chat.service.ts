import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConversationEntity, MessageEntity } from './entities/chat.entity';
import { ModelProviderFactory, ConversationContext } from './providers';
import {
  SendMessageDto,
  ConversationHistoryDto,
  EscalateDto,
  SendMessageResult,
} from './dto/chat.dto';

// Escalation trigger phrases
const ESCALATION_PHRASES = [
  'talk to human',
  'speak to agent',
  'agent please',
  'real person',
  'human please',
  'customer service',
  'representative',
];

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
    private readonly providerFactory: ModelProviderFactory,
  ) {}

  /**
   * Send a message to L1 AI chatbot
   */
  async sendMessage(dto: SendMessageDto): Promise<SendMessageResult> {
    const { message, customerId } = dto;
    let { sessionId } = dto;

    // Generate sessionId if not provided
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // ==========================================
    // BYPASS SWITCH: Skip AI, route to L2 agents
    // Set BYPASS_AI_CHATBOT=true in .env to enable
    // ==========================================
    if (process.env['BYPASS_AI_CHATBOT'] === 'true') {
      this.logger.warn('🔀 BYPASS MODE: Skipping L1 AI, routing directly to L2 agent queue');
      return this.escalateToL2({ sessionId, reason: 'Bypass mode enabled (testing)' });
    }

    // Check for explicit escalation request
    if (this.shouldEscalate(message)) {
      return this.escalateToL2({ sessionId, reason: 'User requested human agent' });
    }

    // Get or create session
    let conversation = await this.conversationRepo.findOne({ where: { sessionId } });

    if (!conversation) {
      conversation = this.conversationRepo.create({
        sessionId,
        customerId,
        tier: 'L1',
        status: 'active',
      });
      await this.conversationRepo.save(conversation);
    }

    // Save user message
    const userMessage = this.messageRepo.create({
      conversationId: conversation.id,
      role: 'user',
      content: message,
      tier: 'L1',
    });
    await this.messageRepo.save(userMessage);

    // Get conversation context
    const context = await this.buildContext(conversation.id, sessionId);

    try {
      // Get healthy provider and generate response
      const provider = await this.providerFactory.getHealthyProvider();
      const response = await provider.generateResponse(message, context);

      // Save assistant message
      const assistantMessage = this.messageRepo.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: response.content,
        tier: 'L1',
        model: response.model,
        provider: response.provider,
        tokensUsed: response.tokensUsed.total,
        latencyMs: response.latencyMs,
      });
      await this.messageRepo.save(assistantMessage);

      return {
        sessionId,
        message: {
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          tier: 'L1',
          model: response.model,
        },
        tier: 'L1',
        tokensUsed: response.tokensUsed.total,
        model: response.model,
        provider: response.provider,
        latencyMs: response.latencyMs,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`AI generation failed: ${errorMessage}`);

      // All providers failed - escalate to L2
      return this.escalateToL2({
        sessionId,
        reason: 'AI service unavailable',
      });
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId: string): Promise<ConversationHistoryDto | null> {
    const conversation = await this.conversationRepo.findOne({
      where: { sessionId },
    });

    if (!conversation) {
      return null;
    }

    const messages = await this.messageRepo.find({
      where: { conversationId: conversation.id },
      order: { timestamp: 'ASC' },
    });

    return {
      sessionId,
      customerId: conversation.customerId,
      tier: conversation.tier,
      status: conversation.status,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        tier: m.tier,
        model: m.model,
      })),
      createdAt: conversation.createdAt,
    };
  }

  /**
   * Escalate conversation to L2 (human agent)
   */
  async escalateToL2(dto: EscalateDto): Promise<{ success: boolean; message: string; tier: 'L2' }> {
    const { sessionId, reason } = dto;

    if (sessionId) {
      const conversation = await this.conversationRepo.findOne({
        where: { sessionId },
      });

      if (conversation) {
        conversation.tier = 'L2';
        conversation.status = 'escalated';
        conversation.escalationReason = reason || 'User requested escalation';
        await this.conversationRepo.save(conversation);
      }
    }

    this.logger.log(`Conversation ${sessionId} escalated to L2: ${reason}`);

    return {
      success: true,
      message: 'You are being connected to a customer service agent. Please wait.',
      tier: 'L2',
    };
  }

  /**
   * Get health status of all AI providers
   */
  async getModelHealth() {
    const health = await this.providerFactory.getAllProviderHealth();
    const activeProvider = this.providerFactory.getActiveProvider();

    return Object.entries(health).map(([provider, isHealthy]) => ({
      provider,
      isHealthy,
      isActive: provider === activeProvider.name,
    }));
  }

  /**
   * Switch active AI provider (admin)
   */
  switchModel(provider: 'ollama' | 'openai' | 'anthropic' | 'cohere'): void {
    this.providerFactory.switchProvider(provider);
    this.logger.log(`Switched to provider: ${provider}`);
  }

  private shouldEscalate(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return ESCALATION_PHRASES.some((phrase) => lowerMessage.includes(phrase));
  }

  private async buildContext(
    conversationId: string,
    sessionId: string,
  ): Promise<ConversationContext> {
    // Get last 10 messages for context window
    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { timestamp: 'DESC' },
      take: 10,
    });

    return {
      sessionId,
      messages: messages.reverse().map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        timestamp: m.timestamp,
      })),
    };
  }
}
