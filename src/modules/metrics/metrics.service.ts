import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, IsNull, FindOptionsWhere } from 'typeorm';
import {
  SessionMetricsEntity,
  DailyAgentSummaryEntity,
  ReportConfigEntity,
} from './entities/metrics.entity';
import {
  CreateReportConfigDto,
  UpdateReportConfigDto,
  DashboardMetricsDto,
  AgentMetricsDto,
  DateRangeDto,
} from './dto/metrics.dto';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    @InjectRepository(SessionMetricsEntity)
    private readonly sessionRepo: Repository<SessionMetricsEntity>,
    @InjectRepository(DailyAgentSummaryEntity)
    private readonly dailyRepo: Repository<DailyAgentSummaryEntity>,
    @InjectRepository(ReportConfigEntity)
    private readonly reportConfigRepo: Repository<ReportConfigEntity>,
  ) {}

  // ============================================
  // Session Tracking
  // ============================================

  async startSession(conversationId: string, agentId: string, tier: 'L0' | 'L1' | 'L2' = 'L2'): Promise<SessionMetricsEntity> {
    const session = this.sessionRepo.create({
      conversationId,
      agentId,
      tier,
    });
    await this.sessionRepo.save(session);
    this.logger.log(`Session started for conversation ${conversationId}`);
    return session;
  }

  async recordFirstResponse(conversationId: string, responseTimeSeconds: number): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { conversationId },
    });
    if (session) {
      session.firstResponseTime = responseTimeSeconds;
      await this.sessionRepo.save(session);
    }
  }

  async endSession(
    conversationId: string,
    resolution: 'resolved' | 'transferred' | 'abandoned',
    csatScore?: number,
  ): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { conversationId },
    });
    if (session) {
      session.endedAt = new Date();
      session.resolution = resolution;
      session.totalHandleTime = Math.round(
        (session.endedAt.getTime() - session.startedAt.getTime()) / 1000,
      );
      if (csatScore) {
        session.csatScore = csatScore;
      }
      await this.sessionRepo.save(session);
      this.logger.log(`Session ended for conversation ${conversationId}: ${resolution}`);
    }
  }

  async incrementMessageCount(conversationId: string): Promise<void> {
    await this.sessionRepo.increment(
      { conversationId },
      'messageCount',
      1,
    );
  }

  // ============================================
  // Real-Time Dashboard
  // ============================================

  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active chats (sessions that haven't ended)
    const activeChats = await this.sessionRepo.count({
      where: { endedAt: IsNull() },
    });

    // Today's resolved
    const todayResolved = await this.sessionRepo.count({
      where: {
        endedAt: MoreThanOrEqual(today),
        resolution: 'resolved',
      },
    });

    // Average CSAT today
    const csatResult = await this.sessionRepo
      .createQueryBuilder('session')
      .select('AVG(session.csatScore)', 'avgCsat')
      .where('session.endedAt >= :today', { today })
      .andWhere('session.csatScore IS NOT NULL')
      .getRawOne();

    return {
      totalActiveChats: activeChats,
      queueDepth: 0, // TODO: Integrate with AgentService
      avgWaitTime: 0,
      onlineAgents: 0,
      utilizationRate: 0,
      todayResolved,
      todayCsat: csatResult?.avgCsat || 0,
    };
  }

  // ============================================
  // Agent Analytics
  // ============================================

  async getAgentMetrics(agentId: string, startDate: Date, endDate: Date): Promise<AgentMetricsDto | null> {
    const sessions = await this.sessionRepo.find({
      where: {
        agentId,
        startedAt: Between(startDate, endDate),
      },
    });

    if (sessions.length === 0) {
      return null;
    }

    const resolved = sessions.filter(s => s.resolution === 'resolved').length;
    const transferred = sessions.filter(s => s.resolution === 'transferred').length;
    const csatScores = sessions.filter(s => s.csatScore).map(s => s.csatScore!);

    const totalHandleTime = sessions.reduce((sum, s) => sum + s.totalHandleTime, 0);
    const totalFRT = sessions.reduce((sum, s) => sum + s.firstResponseTime, 0);

    return {
      agentId,
      agentName: '', // Would join with Agent table
      totalConversations: sessions.length,
      avgHandleTime: sessions.length > 0 ? totalHandleTime / sessions.length : 0,
      avgFirstResponseTime: sessions.length > 0 ? totalFRT / sessions.length : 0,
      resolvedCount: resolved,
      transferredCount: transferred,
      csatScore: csatScores.length > 0
        ? csatScores.reduce((a, b) => a + b, 0) / csatScores.length
        : 0,
      utilizationRate: 0, // Would need agent online time
    };
  }

  async getAllAgentsSummary(dto: DateRangeDto): Promise<AgentMetricsDto[]> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Optimized aggregation query to avoid N+1
    const results = await this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.agent', 'agent')
      .select('session.agentId', 'agentId')
      .addSelect('agent.name', 'agentName')
      .addSelect('COUNT(session.id)', 'totalConversations')
      .addSelect("COUNT(CASE WHEN session.resolution = 'resolved' THEN 1 END)", 'resolvedCount')
      .addSelect("COUNT(CASE WHEN session.resolution = 'transferred' THEN 1 END)", 'transferredCount')
      .addSelect('AVG(session.totalHandleTime)', 'avgHandleTime')
      .addSelect('AVG(session.firstResponseTime)', 'avgFirstResponseTime')
      .addSelect('AVG(session.csatScore)', 'csatScore')
      .where('session.startedAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('session.agentId')
      .addGroupBy('agent.name')
      .getRawMany();

    return results.map(row => ({
      agentId: row.agentId,
      agentName: row.agentName || 'Unknown Agent',
      totalConversations: parseFloat(row.totalConversations),
      avgHandleTime: parseFloat(row.avgHandleTime) || 0,
      avgFirstResponseTime: parseFloat(row.avgFirstResponseTime) || 0,
      resolvedCount: parseFloat(row.resolvedCount),
      transferredCount: parseFloat(row.transferredCount),
      csatScore: parseFloat(row.csatScore) || 0,
      utilizationRate: 0, // Needs online time tracking
    }));
  }

  // ============================================
  // Report Configuration
  // ============================================

  async createReportConfig(dto: CreateReportConfigDto): Promise<ReportConfigEntity> {
    const config = this.reportConfigRepo.create(dto);
    return this.reportConfigRepo.save(config);
  }

  async updateReportConfig(id: string, dto: UpdateReportConfigDto): Promise<ReportConfigEntity> {
    const config = await this.reportConfigRepo.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException(`Report config ${id} not found`);
    }
    Object.assign(config, dto);
    return this.reportConfigRepo.save(config);
  }

  async getReportConfigs(): Promise<ReportConfigEntity[]> {
    return this.reportConfigRepo.find({ order: { createdAt: 'DESC' } });
  }

  async deleteReportConfig(id: string): Promise<void> {
    await this.reportConfigRepo.delete(id);
  }

  // ============================================
  // Export
  // ============================================

  async exportAnalytics(dto: DateRangeDto): Promise<SessionMetricsEntity[]> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const whereCondition: FindOptionsWhere<SessionMetricsEntity> = {
      startedAt: Between(startDate, endDate),
    };

    if (dto.agentId) {
      whereCondition.agentId = dto.agentId;
    }

    return this.sessionRepo.find({
      where: whereCondition,
      order: { startedAt: 'DESC' },
    });
  }
}
