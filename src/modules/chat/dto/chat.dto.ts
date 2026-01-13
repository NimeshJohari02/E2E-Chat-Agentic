import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message text from customer',
    example: 'How do I reset my password?',
  })
  @IsString()
  message!: string;

  @ApiPropertyOptional({
    description: 'Existing session ID for continuing conversation',
    format: 'uuid',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Customer identifier',
    example: 'customer-123',
  })
  @IsString()
  @IsOptional()
  customerId?: string;
}

export interface ChatMessageDto {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tier?: 'L0' | 'L1' | 'L2';
  model?: string;
}

export interface ChatResponseDto {
  sessionId: string;
  message: ChatMessageDto;
  tier: 'L1';
  tokensUsed?: number;
  model?: string;
  provider?: string;
  latencyMs?: number;
}

export interface EscalationResponseDto {
  sessionId: string;
  success: boolean;
  message: string;
  tier: 'L2';
}

export class EscalateDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  sessionId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export interface ConversationHistoryDto {
  sessionId: string;
  customerId?: string;
  tier: 'L0' | 'L1' | 'L2';
  status: string;
  messages: ChatMessageDto[];
  createdAt: Date;
}

export interface ModelHealthDto {
  provider: string;
  isHealthy: boolean;
  isActive: boolean;
}

export class SwitchModelDto {
  @ApiProperty({ enum: ['ollama', 'openai', 'anthropic', 'cohere'] })
  @IsString()
  provider!: 'ollama' | 'openai' | 'anthropic' | 'cohere';
}

// Union type for sendMessage return - either chat response or escalation
export type SendMessageResult = ChatResponseDto | EscalationResponseDto;
