import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  SessionMetricsEntity,
  DailyAgentSummaryEntity,
  ReportConfigEntity,
} from './entities/metrics.entity';
import { Repository } from 'typeorm';

/**
 * Metrics Service Unit Tests
 * Author: Quinn (QA Automation Lead)
 * PRD Reference: PRD-004 - Agent Dashboard & Efficiency Metrics
 *
 * Test Coverage:
 * - TC-001: Start session tracking
 * - TC-002: Record first response time
 * - TC-003: End session with resolution
 * - TC-004: Get dashboard metrics
 * - TC-005: Create report configuration
 * - TC-006: Export analytics data
 */

describe('MetricsService', () => {
  let service: MetricsService;
  let sessionRepo: jest.Mocked<Repository<SessionMetricsEntity>>;
  let dailyRepo: jest.Mocked<Repository<DailyAgentSummaryEntity>>;
  let reportConfigRepo: jest.Mocked<Repository<ReportConfigEntity>>;

  const mockSession: SessionMetricsEntity = {
    id: 'session-123',
    conversationId: 'conv-456',
    agentId: 'agent-789',
    startedAt: new Date(),
    endedAt: null,
    firstResponseTime: 0,
    totalHandleTime: 0,
    activeTypingTime: 0,
    idleTime: 0,
    customerWaitTime: 0,
    resolution: 'active',
    transferredTo: null,
    csatScore: null,
    messageCount: 0,
    tier: 'L2',
  };

  const mockReportConfig: ReportConfigEntity = {
    id: 'report-123',
    name: 'Daily Report',
    recipients: ['manager@test.com'],
    schedule: '0 9 * * *',
    format: 'both',
    metrics: ['AHT', 'FRT', 'CSAT'],
    timezone: 'UTC',
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockSessionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      increment: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avgCsat: 4.2 }),
        getRawMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const mockDailyRepo = {
      find: jest.fn(),
      save: jest.fn(),
    };

    const mockReportConfigRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: getRepositoryToken(SessionMetricsEntity),
          useValue: mockSessionRepo,
        },
        {
          provide: getRepositoryToken(DailyAgentSummaryEntity),
          useValue: mockDailyRepo,
        },
        {
          provide: getRepositoryToken(ReportConfigEntity),
          useValue: mockReportConfigRepo,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    sessionRepo = module.get(getRepositoryToken(SessionMetricsEntity));
    dailyRepo = module.get(getRepositoryToken(DailyAgentSummaryEntity));
    reportConfigRepo = module.get(getRepositoryToken(ReportConfigEntity));
  });

  describe('Session Tracking', () => {
    it('TC-001: should start session tracking', async () => {
      sessionRepo.create.mockReturnValue(mockSession);
      sessionRepo.save.mockResolvedValue(mockSession);

      const result = await service.startSession('conv-456', 'agent-789', 'L2');

      expect(result.conversationId).toBe('conv-456');
      expect(result.agentId).toBe('agent-789');
      expect(result.tier).toBe('L2');
    });

    it('TC-002: should record first response time', async () => {
      sessionRepo.findOne.mockResolvedValue(mockSession);
      sessionRepo.save.mockResolvedValue({ ...mockSession, firstResponseTime: 15 });

      await service.recordFirstResponse('conv-456', 15);

      expect(sessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ firstResponseTime: 15 }),
      );
    });

    it('TC-003: should end session with resolution', async () => {
      sessionRepo.findOne.mockResolvedValue(mockSession);
      sessionRepo.save.mockResolvedValue({
        ...mockSession,
        resolution: 'resolved',
        csatScore: 5,
      });

      await service.endSession('conv-456', 'resolved', 5);

      expect(sessionRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resolution: 'resolved',
          csatScore: 5,
        }),
      );
    });

    it('TC-004: should increment message count', async () => {
      await service.incrementMessageCount('conv-456');

      expect(sessionRepo.increment).toHaveBeenCalledWith(
        { conversationId: 'conv-456' },
        'messageCount',
        1,
      );
    });
  });

  describe('Dashboard Metrics', () => {
    it('TC-005: should return dashboard metrics', async () => {
      sessionRepo.count
        .mockResolvedValueOnce(5) // Active chats
        .mockResolvedValueOnce(10); // Today resolved

      const result = await service.getDashboardMetrics();

      expect(result).toHaveProperty('totalActiveChats');
      expect(result).toHaveProperty('todayResolved');
      expect(result).toHaveProperty('todayCsat');
    });
  });

  describe('Report Configuration', () => {
    it('TC-006: should create report config', async () => {
      reportConfigRepo.create.mockReturnValue(mockReportConfig);
      reportConfigRepo.save.mockResolvedValue(mockReportConfig);

      const result = await service.createReportConfig({
        name: 'Daily Report',
        recipients: ['manager@test.com'],
      });

      expect(result.name).toBe('Daily Report');
      expect(result.recipients).toContain('manager@test.com');
    });

    it('TC-007: should get all report configs', async () => {
      reportConfigRepo.find.mockResolvedValue([mockReportConfig]);

      const result = await service.getReportConfigs();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Daily Report');
    });

    it('TC-008: should delete report config', async () => {
      await service.deleteReportConfig('report-123');

      expect(reportConfigRepo.delete).toHaveBeenCalledWith('report-123');
    });
  });

  describe('Analytics Export', () => {
    it('TC-009: should export analytics data', async () => {
      sessionRepo.find.mockResolvedValue([mockSession]);

      const result = await service.exportAnalytics({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(result).toHaveLength(1);
      expect(result[0].conversationId).toBe('conv-456');
    });

    it('TC-010: should filter by agentId when provided', async () => {
      sessionRepo.find.mockResolvedValue([mockSession]);

      await service.exportAnalytics({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        agentId: 'agent-789',
      });

      expect(sessionRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            agentId: 'agent-789',
          }),
        }),
      );
    });
  });
});
