import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import {
  SessionMetricsEntity,
  DailyAgentSummaryEntity,
  ReportConfigEntity,
} from './entities/metrics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionMetricsEntity,
      DailyAgentSummaryEntity,
      ReportConfigEntity,
    ]),
  ],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
