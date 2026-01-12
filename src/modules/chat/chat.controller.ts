import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendMessageDto, EscalateDto, SwitchModelDto } from './dto/chat.dto';

@ApiTags('Chat')
@Controller('api/v1')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * L1 Chat Endpoint - Customer facing
   * Send message to AI chatbot
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send message to AI Chatbot (L1)',
    description: `
Customer-facing chat endpoint. Sends message to AI and returns response.

**Bypass Mode**: If \`BYPASS_AI_CHATBOT=true\` in .env, skips AI and routes directly to L2 agent queue.

**Escalation**: Automatically escalates to L2 if message contains phrases like "talk to human", "speak to agent", etc.
    `,
  })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 200,
    description: 'Message processed successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', format: 'uuid' },
        message: {
          type: 'object',
          properties: {
            role: { type: 'string', example: 'assistant' },
            content: { type: 'string', example: 'I can help you with that!' },
            timestamp: { type: 'string', format: 'date-time' },
            tier: { type: 'string', example: 'L1' },
            model: { type: 'string', example: 'llama2' },
          },
        },
        tier: { type: 'string', example: 'L1' },
        tokensUsed: { type: 'number', example: 45 },
        provider: { type: 'string', example: 'ollama' },
        latencyMs: { type: 'number', example: 1250 },
      },
    },
  })
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  /**
   * Get conversation history by session ID
   */
  @Get('chat/session/:sessionId')
  @ApiOperation({
    summary: 'Get conversation history',
    description: 'Retrieves full conversation history for a session including all messages from L0, L1, and L2.',
  })
  @ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Conversation history retrieved' })
  async getConversationHistory(@Param('sessionId') sessionId: string) {
    const history = await this.chatService.getConversationHistory(sessionId);

    if (!history) {
      return {
        success: false,
        message: 'Session not found',
      };
    }

    return {
      success: true,
      data: history,
    };
  }

  /**
   * Manual escalation to L2 (human agent)
   */
  @Post('chat/escalate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Escalate to human agent (L2)',
    description: 'Manually escalates conversation to L2 agent queue. Use when customer explicitly requests human support.',
  })
  @ApiBody({ type: EscalateDto })
  @ApiResponse({
    status: 200,
    description: 'Escalation successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'You are being connected to a customer service agent.' },
        tier: { type: 'string', example: 'L2' },
      },
    },
  })
  async escalate(@Body() dto: EscalateDto) {
    return this.chatService.escalateToL2(dto);
  }

  /**
   * Get health status of all AI model providers
   */
  @Get('models/health')
  @ApiOperation({
    summary: 'Get AI model health status',
    description: 'Returns health status of all configured AI providers (Ollama, OpenAI, Anthropic).',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string', example: 'ollama' },
              isHealthy: { type: 'boolean', example: true },
              isActive: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  async getModelHealth() {
    const health = await this.chatService.getModelHealth();
    return {
      success: true,
      providers: health,
    };
  }

  /**
   * Switch active AI model provider (admin)
   */
  @Post('models/switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Switch AI model provider (Admin)',
    description: 'Switches the active AI provider at runtime. Requires admin privileges.',
  })
  @ApiBody({ type: SwitchModelDto })
  @ApiResponse({
    status: 200,
    description: 'Provider switched successfully',
  })
  async switchModel(@Body() dto: SwitchModelDto) {
    this.chatService.switchModel(dto.provider);
    return {
      success: true,
      message: `Switched to ${dto.provider}`,
      activeProvider: dto.provider,
    };
  }
}
