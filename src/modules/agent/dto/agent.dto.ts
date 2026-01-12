import { IsString, IsEmail, IsOptional, IsArray, IsInt, Min, Max, IsIn } from 'class-validator';

export class AgentLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class CreateAgentDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxConcurrentChats?: number;
}

export class UpdateAgentStatusDto {
  @IsIn(['online', 'away', 'busy', 'offline'])
  status: 'online' | 'away' | 'busy' | 'offline';
}

export class AgentResponseDto {
  id: string;
  email: string;
  name: string;
  status: string;
  currentChats: string[];
  maxConcurrentChats: number;
  skills: string[];
  lastActiveAt: Date;
}

export class LoginResponseDto {
  success: boolean;
  agent?: AgentResponseDto;
  token?: string;
  message?: string;
}

export class QueuePositionDto {
  conversationId: string;
  position: number;
  estimatedWait: string;
}

export class AssignNextDto {
  @IsString()
  agentId: string;
}

export class TransferConversationDto {
  @IsString()
  conversationId: string;

  @IsString()
  toAgentId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueueStatusDto {
  totalWaiting: number;
  avgWaitTime: number;
  onlineAgents: number;
  entries: {
    id: string;
    conversationId: string;
    position: number;
    waitTime: number;
  }[];
}
