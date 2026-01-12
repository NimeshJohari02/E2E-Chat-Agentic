# PRD-004: Agent Dashboard & Efficiency Metrics

**Author**: Liam (Senior PM - Agent Productivity)
**Status**: Draft
**Created**: 2026-01-13

---

## Executive Summary

Track agent performance metrics with automated daily reports sent to configured emails. Monitor time spent per chat session, resolution rates, and overall agent efficiency to optimize workforce allocation.

---

## User Stories

### US-001: Per-Session Time Tracking
**As a** supervisor
**I want to** see time spent per chat session
**So that** I can identify training opportunities

**Acceptance Criteria**:
- Track time from assignment to resolution
- Break down by agent activity (typing, idle, waiting)
- Handle time calculations for transferred chats
- Real-time session timer visible to agents

### US-002: Daily Efficiency Reports
**As a** supervisor
**I want to** receive daily efficiency reports via email
**So that** I can monitor team performance

**Acceptance Criteria**:
- Configurable recipient list (select emails)
- Daily report at configured time (default: 9 AM)
- CSV and HTML format options
- Report includes all key metrics

### US-003: Real-Time Dashboard
**As a** supervisor
**I want to** see real-time agent metrics
**So that** I can manage workload in real-time

**Acceptance Criteria**:
- Live agent status overview
- Current queue depth
- Average wait time (rolling 1 hour)
- Agent utilization percentage

### US-004: Historical Analytics
**As a** supervisor
**I want to** analyze historical trends
**So that** I can plan staffing

**Acceptance Criteria**:
- Date range selection
- Trend charts for key metrics
- Export to CSV/Excel
- Filter by agent, shift, day of week

---

## Key Metrics Tracked

| Metric | Description | Calculation |
|--------|-------------|-------------|
| **First Response Time (FRT)** | Time from assignment to first agent message | `firstMessageAt - assignedAt` |
| **Average Handle Time (AHT)** | Total time to resolve a conversation | `resolvedAt - assignedAt` |
| **Agent Utilization Rate** | % of time agent is actively chatting | `totalChatTime / totalOnlineTime` |
| **Concurrent Chat Avg** | Average simultaneous chats per agent | `sum(activeChatMinutes) / onlineMinutes` |
| **Deflection Rate** | % resolved at L0/L1 vs escalated to L2 | `(l0 + l1Resolved) / totalQueries` |
| **Resolution Rate** | % resolved without transfer | `resolved / (resolved + transferred)` |
| **CSAT Score** | Customer satisfaction (post-chat survey) | Average of 1-5 ratings |

---

## Non-Functional Requirements (NFRs)

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Metrics Latency | < 30s for dashboard refresh | Real-time testing |
| Report Delivery | Daily at configured time ± 5 min | Email logs |
| Data Retention | 90 days detailed, 2 years aggregated | Storage policy |
| Export Performance | < 10s for 30-day export | Load testing |

---

## Technical Specifications

### Data Models (Garrett/Riley Design)

```typescript
interface SessionMetrics {
  conversationId: string;
  agentId: string;
  startedAt: Date;

  // Time tracking (in seconds)
  firstResponseTime: number;
  totalHandleTime: number;
  activeTypingTime: number;
  idleTime: number;
  customerWaitTime: number;

  // Outcomes
  resolution: 'resolved' | 'transferred' | 'abandoned';
  transferredTo?: string;
  csatScore?: number;

  // Metadata
  messageCount: number;
  tier: 'L0' | 'L1' | 'L2';
}

interface DailyAgentSummary {
  agentId: string;
  date: Date;

  // Aggregates
  totalConversations: number;
  totalHandleTime: number;
  avgFirstResponseTime: number;
  avgHandleTime: number;
  utilizationRate: number;
  resolvedCount: number;
  transferredCount: number;
  avgCsat: number;

  // Shift details
  onlineTime: number;
  awayTime: number;
  busyTime: number;
}

interface ReportConfig {
  id: string;
  name: string;
  recipients: string[];       // Email addresses
  schedule: string;           // Cron expression
  format: 'html' | 'csv' | 'both';
  metrics: string[];          // Which metrics to include
  timezone: string;
  isActive: boolean;
}
```

### API Endpoints

```
# Real-Time Metrics
GET /api/v1/metrics/dashboard          - Real-time dashboard data
GET /api/v1/metrics/agents/:id         - Individual agent metrics
GET /api/v1/metrics/queue              - Queue metrics

# Historical Analytics
GET /api/v1/analytics/summary          - Aggregated summary (date range)
GET /api/v1/analytics/agents           - Per-agent breakdown
GET /api/v1/analytics/trends           - Trend data for charts
GET /api/v1/analytics/export           - Export to CSV

# Report Configuration
GET    /api/v1/reports                 - List report configs
POST   /api/v1/reports                 - Create report config
PUT    /api/v1/reports/:id             - Update report config
DELETE /api/v1/reports/:id             - Delete report config
POST   /api/v1/reports/:id/test        - Send test report
```

### Daily Report Email Structure

```
Subject: Daily Agent Efficiency Report - {date}

SUMMARY
- Total Conversations: 245
- Avg Handle Time: 4m 32s
- CSAT Score: 4.2/5
- Deflection Rate: 68%

TOP PERFORMERS
1. Agent A - 45 resolved, 4.8 CSAT
2. Agent B - 42 resolved, 4.5 CSAT

NEEDS ATTENTION
- Agent C - AHT 12m (target: 5m)
- Queue peaked at 15 customers at 2:30 PM

[View Full Dashboard] [Download CSV]
```

---

## UAT Test Cases (Mia)

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| TC-001 | Agent resolves conversation | Metrics calculated, dashboard updated |
| TC-002 | Daily report scheduled | Email sent at configured time |
| TC-003 | Add email to recipient list | Email receives next daily report |
| TC-004 | Export 30 days data | CSV downloaded < 10s |
| TC-005 | Agent transfers conversation | Time split correctly between agents |
| TC-006 | No conversations in day | Report shows zero metrics, not error |

---

## Frontend TODO (Placeholder)

- [ ] Real-time dashboard with charts
- [ ] Agent leaderboard component
- [ ] Date range picker for analytics
- [ ] Report configuration form
- [ ] Email recipient management
- [ ] Export button with format options

---

## Rollout Strategy

1. **Phase 1**: Metrics collection enabled silently
2. **Phase 2**: Dashboard for supervisors only
3. **Phase 3**: Agent self-view of personal metrics
4. **Phase 4**: Automated daily reports enabled
