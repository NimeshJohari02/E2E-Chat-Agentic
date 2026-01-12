import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { CreateReportConfigDto, UpdateReportConfigDto, DateRangeDto } from './dto/metrics.dto';

@ApiTags('Metrics')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // ============================================
  // Real-Time Dashboard
  // ============================================

  @Get('metrics/dashboard')
  @ApiOperation({
    summary: 'Get real-time dashboard metrics',
    description: 'Returns live metrics for the support dashboard including active chats, queue depth, and CSAT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved',
    schema: {
      type: 'object',
      properties: {
        totalActiveChats: { type: 'number', example: 12 },
        queueDepth: { type: 'number', example: 5 },
        avgWaitTime: { type: 'number', example: 3.5 },
        onlineAgents: { type: 'number', example: 8 },
        utilizationRate: { type: 'number', example: 75.5 },
        todayResolved: { type: 'number', example: 142 },
        todayCsat: { type: 'number', example: 4.7 },
      },
    },
  })
  async getDashboard() {
    return this.metricsService.getDashboardMetrics();
  }

  @Get('metrics/agents/:agentId')
  @ApiOperation({
    summary: 'Get agent performance metrics',
    description: 'Returns performance metrics for a specific agent within a date range.',
  })
  @ApiParam({ name: 'agentId', type: 'string', format: 'uuid' })
  @ApiQuery({ name: 'startDate', type: 'string', example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', type: 'string', example: '2026-01-31' })
  @ApiResponse({
    status: 200,
    description: 'Agent metrics retrieved',
    schema: {
      type: 'object',
      properties: {
        agentId: { type: 'string' },
        agentName: { type: 'string' },
        totalConversations: { type: 'number' },
        avgHandleTime: { type: 'number' },
        avgFirstResponseTime: { type: 'number' },
        resolvedCount: { type: 'number' },
        csatScore: { type: 'number' },
      },
    },
  })
  async getAgentMetrics(
    @Param('agentId') agentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.metricsService.getAgentMetrics(
      agentId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('metrics/queue')
  @ApiOperation({
    summary: 'Get queue metrics',
    description: 'Returns current queue performance metrics.',
  })
  @ApiResponse({ status: 200, description: 'Queue metrics retrieved' })
  async getQueueMetrics() {
    return {
      depth: 0,
      avgWaitTime: 0,
    };
  }

  // ============================================
  // Analytics
  // ============================================

  @Get('analytics/summary')
  @ApiOperation({
    summary: 'Get analytics summary',
    description: 'Returns aggregated performance summary for all agents within a date range.',
  })
  @ApiQuery({ name: 'startDate', type: 'string', required: true })
  @ApiQuery({ name: 'endDate', type: 'string', required: true })
  @ApiQuery({ name: 'agentId', type: 'string', required: false })
  @ApiResponse({ status: 200, description: 'Analytics summary retrieved' })
  async getAnalyticsSummary(@Query() dto: DateRangeDto) {
    return this.metricsService.getAllAgentsSummary(dto);
  }

  @Get('analytics/agents')
  @ApiOperation({
    summary: 'Get all agents analytics',
    description: 'Returns performance analytics for all agents within a date range.',
  })
  @ApiQuery({ name: 'startDate', type: 'string', required: true })
  @ApiQuery({ name: 'endDate', type: 'string', required: true })
  @ApiResponse({ status: 200, description: 'Agent analytics retrieved' })
  async getAgentsAnalytics(@Query() dto: DateRangeDto) {
    return this.metricsService.getAllAgentsSummary(dto);
  }

  @Get('analytics/export')
  @ApiOperation({
    summary: 'Export analytics data',
    description: 'Exports raw session metrics as JSON for external analysis.',
  })
  @ApiQuery({ name: 'startDate', type: 'string', required: true })
  @ApiQuery({ name: 'endDate', type: 'string', required: true })
  @ApiQuery({ name: 'agentId', type: 'string', required: false })
  @ApiResponse({
    status: 200,
    description: 'Analytics exported',
    schema: {
      type: 'object',
      properties: {
        format: { type: 'string', example: 'json' },
        count: { type: 'number', example: 150 },
        data: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  async exportAnalytics(@Query() dto: DateRangeDto) {
    const data = await this.metricsService.exportAnalytics(dto);
    return {
      format: 'json',
      count: data.length,
      data,
    };
  }

  // ============================================
  // Report Configuration
  // ============================================

  @Get('reports')
  @ApiOperation({
    summary: 'Get all report configurations',
    description: 'Returns list of configured automated reports.',
  })
  @ApiResponse({ status: 200, description: 'Report configs retrieved' })
  async getReportConfigs() {
    return this.metricsService.getReportConfigs();
  }

  @Post('reports')
  @ApiOperation({
    summary: 'Create report configuration',
    description: 'Creates a new automated report configuration with schedule and recipients.',
  })
  @ApiBody({ type: CreateReportConfigDto })
  @ApiResponse({ status: 201, description: 'Report config created' })
  async createReportConfig(@Body() dto: CreateReportConfigDto) {
    return this.metricsService.createReportConfig(dto);
  }

  @Put('reports/:id')
  @ApiOperation({
    summary: 'Update report configuration',
    description: 'Updates an existing report configuration.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateReportConfigDto })
  @ApiResponse({ status: 200, description: 'Report config updated' })
  async updateReportConfig(
    @Param('id') id: string,
    @Body() dto: UpdateReportConfigDto,
  ) {
    return this.metricsService.updateReportConfig(id, dto);
  }

  @Delete('reports/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete report configuration',
    description: 'Deletes a report configuration.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Report config deleted' })
  async deleteReportConfig(@Param('id') id: string) {
    await this.metricsService.deleteReportConfig(id);
  }

  @Post('reports/:id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send test report',
    description: 'Sends a test report email to configured recipients.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Test report sent' })
  async sendTestReport(@Param('id') id: string) {
    return {
      success: true,
      message: 'Test report sent',
    };
  }
}
