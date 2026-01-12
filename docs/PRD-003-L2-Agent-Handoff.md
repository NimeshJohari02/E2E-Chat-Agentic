# PRD-003: L2 Agent Handoff System

**Author**: Sophia (Senior PM - Customer Experience)
**Status**: Draft
**Created**: 2026-01-13
**Target Traffic**: ~10% of queries (escalated from L1)

---

## Executive Summary

L2 Agent Handoff manages the transition from AI chatbot to human customer service agents. Agents authenticate via platform login, are placed in queues, and receive customer requests with full conversation context.

---

## User Stories

### US-001: Agent Authentication
**As a** customer service agent
**I want to** login to the platform
**So that** I can start receiving customer requests

**Acceptance Criteria**:
- Secure login (email/password or SSO)
- Agent status management (Online, Away, Busy, Offline)
- Session timeout with auto-logout
- Multi-device prevention (one session per agent)

### US-002: Queue Management
**As a** system
**I want to** queue customers waiting for agents
**So that** requests are handled fairly

**Acceptance Criteria**:
- FIFO queue by default
- Priority queue for VIP customers (configurable)
- Real-time queue position updates to customers
- Queue timeout with callback option

### US-003: Request Assignment
**As an** agent
**I want to** receive customer requests
**So that** I can help them

**Acceptance Criteria**:
- Auto-assignment based on availability
- Manual pickup option for agents
- Skill-based routing (future phase)
- Load balancing across online agents

### US-004: Conversation Context
**As an** agent
**I want to** see the full L0/L1 conversation history
**So that** customers don't have to repeat themselves

**Acceptance Criteria**:
- Complete chat transcript visible
- L0/L1/L2 tier labels on messages
- Customer sentiment indicators
- Previous interaction history (if any)

### US-005: Session Handoff
**As an** agent
**I want to** transfer conversations to other agents
**So that** customers get specialized help

**Acceptance Criteria**:
- Transfer to specific agent
- Transfer to queue/skill group
- Add notes during transfer
- Full context preserved

---

## Non-Functional Requirements (NFRs)

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Queue Assignment Time | < 5 seconds | APM |
| Max Concurrent Chats/Agent | 5 (configurable) | System setting |
| Message Delivery | < 500ms | Real-time testing |
| System Availability | 99.9% | Uptime monitoring |

---

## Success Metrics

- **First Response Time**: < 30 seconds after assignment
- **Customer Wait Time**: < 2 minutes average queue time
- **Transfer Rate**: < 15% of conversations transferred
- **Resolution Rate**: 95% resolved in first contact

---

## Technical Specifications

### Data Models (Garrett's Design)

```typescript
interface Agent {
  id: string;
  email: string;
  name: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentChats: string[];    // Active conversation IDs
  maxConcurrentChats: number;
  skills: string[];
  createdAt: Date;
  lastActiveAt: Date;
}

interface QueueEntry {
  id: string;
  conversationId: string;
  customerId: string;
  priority: number;
  createdAt: Date;
  assignedAt?: Date;
  assignedAgentId?: string;
  status: 'waiting' | 'assigned' | 'timeout';
}

interface Conversation {
  id: string;
  customerId: string;
  agentId?: string;
  messages: Message[];
  tier: 'L0' | 'L1' | 'L2';
  status: 'active' | 'resolved' | 'transferred';
  metadata: {
    startedAt: Date;
    l0Duration?: number;
    l1Duration?: number;
    l2Duration?: number;
    escalationReason?: string;
  };
}
```

### API Endpoints (Nathan's Design)

```
# Agent Authentication
POST /api/v1/agents/login       - Agent login
POST /api/v1/agents/logout      - Agent logout
PUT  /api/v1/agents/status      - Update status (online/away/busy)

# Queue Management
GET  /api/v1/queue              - Get queue status (admin)
GET  /api/v1/queue/position/:id - Customer's queue position
POST /api/v1/queue/assign       - Assign next customer to agent

# Conversations
GET  /api/v1/conversations/:id           - Get conversation with full context
POST /api/v1/conversations/:id/messages  - Send message
POST /api/v1/conversations/:id/transfer  - Transfer to another agent
POST /api/v1/conversations/:id/resolve   - Mark resolved
```

---

## UAT Test Cases (Mia)

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| TC-001 | Agent logs in | Status set to 'online', visible to queue |
| TC-002 | Customer escalates from L1 | Added to queue with full context |
| TC-003 | Agent goes 'away' | Stop receiving new assignments |
| TC-004 | Customer waits > 5 min | Callback option offered |
| TC-005 | Agent reaches max chats | Stop assignments until slots free |
| TC-006 | Transfer conversation | New agent sees full history |
| TC-007 | Agent idle > 30 min | Auto-logout triggered |

---

## Frontend TODO (Placeholder)

- [ ] Agent login page
- [ ] Agent dashboard with queue view
- [ ] Active conversations panel
- [ ] Chat interface with customer
- [ ] Transfer dialog with agent list
- [ ] Customer queue position indicator

---

## Rollout Strategy

1. **Phase 1**: Internal agent testing with mock customers
2. **Phase 2**: 5 agents pilot with real L2 escalations
3. **Phase 3**: Full agent team onboarding
4. **Phase 4**: Skill-based routing implementation
