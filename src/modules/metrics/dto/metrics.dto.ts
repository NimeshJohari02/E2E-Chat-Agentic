import { IsString, IsArray, IsEmail, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateReportConfigDto {
  @IsString()
  name: string;

  @IsArray()
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsIn(['html', 'csv', 'both'])
  @IsOptional()
  format?: 'html' | 'csv' | 'both';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metrics?: string[];

  @IsString()
  @IsOptional()
  timezone?: string;
}

export class UpdateReportConfigDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  recipients?: string[];

  @IsString()
  @IsOptional()
  schedule?: string;

  @IsIn(['html', 'csv', 'both'])
  @IsOptional()
  format?: 'html' | 'csv' | 'both';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class DateRangeDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsString()
  @IsOptional()
  agentId?: string;
}

export class DashboardMetricsDto {
  totalActiveChats: number;
  queueDepth: number;
  avgWaitTime: number;
  onlineAgents: number;
  utilizationRate: number;
  todayResolved: number;
  todayCsat: number;
}

export class AgentMetricsDto {
  agentId: string;
  agentName: string;
  totalConversations: number;
  avgHandleTime: number;
  avgFirstResponseTime: number;
  resolvedCount: number;
  transferredCount: number;
  csatScore: number;
  utilizationRate: number;
}

export class TrendDataDto {
  date: string;
  totalConversations: number;
  avgHandleTime: number;
  avgCsat: number;
  deflectionRate: number;
}
