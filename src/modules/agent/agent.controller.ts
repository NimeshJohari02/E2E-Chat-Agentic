import {
  Controller,
  Get,
  Post,
  Put,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AgentService } from './agent.service';
import {
  AgentLoginDto,
  CreateAgentDto,
  UpdateAgentStatusDto,
  AssignNextDto,
} from './dto/agent.dto';

@ApiTags('Agents')
@Controller('api/v1')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  // ============================================
  // Agent Authentication
  // ============================================

  @Post('agents/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Agent login',
    description: 'Authenticates agent with email/password. Returns JWT token and agent profile.',
  })
  @ApiBody({ type: AgentLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        agent: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', example: 'agent@company.com' },
            name: { type: 'string', example: 'John Smith' },
            status: { type: 'string', enum: ['online', 'away', 'busy', 'offline'] },
            currentChats: { type: 'array', items: { type: 'string' } },
            maxConcurrentChats: { type: 'number', example: 5 },
          },
        },
        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: AgentLoginDto) {
    return this.agentService.login(dto);
  }

  @Post('agents/logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Agent logout',
    description: 'Logs out agent and sets status to offline.',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() body: { agentId: string }) {
    await this.agentService.logout(body.agentId);
    return { success: true, message: 'Logged out successfully' };
  }

  @Put('agents/status')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update agent status',
    description: 'Updates agent availability status. Use "away" to stop receiving new assignments.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['agentId', 'status'],
      properties: {
        agentId: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: ['online', 'away', 'busy', 'offline'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(@Body() body: { agentId: string } & UpdateAgentStatusDto) {
    const { agentId, ...dto } = body;
    return this.agentService.updateStatus(agentId, dto);
  }

  // ============================================
  // Queue Management
  // ============================================

  @Get('queue')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get queue status',
    description: 'Returns current queue status including waiting customers, average wait time, and online agents.',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue status retrieved',
    schema: {
      type: 'object',
      properties: {
        totalWaiting: { type: 'number', example: 5 },
        avgWaitTime: { type: 'number', example: 3.5 },
        onlineAgents: { type: 'number', example: 3 },
        entries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              conversationId: { type: 'string' },
              position: { type: 'number' },
              waitTime: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getQueueStatus() {
    return this.agentService.getQueueStatus();
  }

  @Get('queue/position/:conversationId')
  @ApiOperation({
    summary: 'Get queue position',
    description: 'Returns current position in queue for a customer. Use to display wait time.',
  })
  @ApiParam({ name: 'conversationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Position retrieved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            conversationId: { type: 'string' },
            position: { type: 'number', example: 3 },
            estimatedWait: { type: 'string', example: '6 minutes' },
          },
        },
      },
    },
  })
  async getQueuePosition(@Param('conversationId') conversationId: string) {
    const position = await this.agentService.getQueuePosition(conversationId);

    if (!position) {
      return {
        success: false,
        message: 'Conversation not found in queue',
      };
    }

    return {
      success: true,
      data: position,
    };
  }

  @Post('queue/assign')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Assign next customer to agent',
    description: 'Assigns the next customer in queue to the specified agent. Respects priority and FIFO.',
  })
  @ApiBody({ type: AssignNextDto })
  @ApiResponse({
    status: 200,
    description: 'Customer assigned or queue empty',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        conversationId: { type: 'string', format: 'uuid' },
        message: { type: 'string' },
      },
    },
  })
  async assignNext(@Body() dto: AssignNextDto) {
    const entry = await this.agentService.assignNextToAgent(dto.agentId);

    if (!entry) {
      return {
        success: false,
        message: 'No customers waiting in queue',
      };
    }

    return {
      success: true,
      conversationId: entry.conversationId,
      message: 'Customer assigned successfully',
    };
  }

  // ============================================
  // Agent Management (Admin)
  // ============================================

  @Get('agents')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all agents (Admin)',
    description: 'Returns list of all agents. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'Agent list retrieved' })
  async getAllAgents() {
    return this.agentService.findAllAgents();
  }

  @Get('agents/online')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get online agents',
    description: 'Returns list of currently online agents.',
  })
  @ApiResponse({ status: 200, description: 'Online agents retrieved' })
  async getOnlineAgents() {
    return this.agentService.getOnlineAgents();
  }

  @Post('agents')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create agent (Admin)',
    description: 'Creates a new agent account. Admin only.',
  })
  @ApiBody({ type: CreateAgentDto })
  @ApiResponse({ status: 201, description: 'Agent created successfully' })
  @ApiResponse({ status: 400, description: 'Agent with email already exists' })
  async createAgent(@Body() dto: CreateAgentDto) {
    return this.agentService.createAgent(dto);
  }
}
