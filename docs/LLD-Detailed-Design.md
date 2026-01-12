# Low Level Design (LLD) - Chatbot Backend System

**Authors**: Sarah (Platform Lead), Marcus (Feature Lead)
**Reviewed By**: Garrett (Principal - Infra), Nathan (Principal - App)
**Version**: 1.0
**Date**: 2026-01-13

---

## 1. Module Detailed Design

### 1.1 L0 FAQ Module

#### 1.1.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FaqModule                             │
├─────────────────────────────────────────────────────────────┤
│  imports: [TypeOrmModule.forFeature([FaqEntity])]           │
│  controllers: [FaqController]                                │
│  providers: [FaqService]                                     │
│  exports: [FaqService]                                       │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────────┐
│   FaqController     │              │      FaqService         │
├─────────────────────┤              ├─────────────────────────┤
│ +query(dto)         │─────────────▶│ +query(dto): FaqResponse│
│ +findAll()          │              │ +findExactMatch()       │
│ +findOne(id)        │              │ +findFuzzyMatch()       │
│ +create(dto)        │              │ +create(dto)            │
│ +update(id, dto)    │              │ +findAll()              │
│ +remove(id)         │              │ +findOne(id)            │
│ +bulkImport(dto)    │              │ +update(id, dto)        │
│ +export()           │              │ +remove(id)             │
└─────────────────────┘              │ +bulkImport(faqs[])     │
                                     │ +export()               │
                                     └───────────┬─────────────┘
                                                 │
                                                 ▼
                                     ┌─────────────────────────┐
                                     │      FaqEntity          │
                                     ├─────────────────────────┤
                                     │ id: UUID                │
                                     │ question: string        │
                                     │ variations: string[]    │
                                     │ answer: string          │
                                     │ category: string        │
                                     │ tags: string[]          │
                                     │ priority: number        │
                                     │ isActive: boolean       │
                                     │ createdAt: Date         │
                                     │ updatedAt: Date         │
                                     └─────────────────────────┘
```

#### 1.1.2 Sequence Diagram - Query Flow

```
Customer          FaqController         FaqService           Database
   │                   │                    │                    │
   │  POST /query      │                    │                    │
   │──────────────────▶│                    │                    │
   │                   │  query(dto)        │                    │
   │                   │───────────────────▶│                    │
   │                   │                    │  findExactMatch()  │
   │                   │                    │───────────────────▶│
   │                   │                    │◀───────────────────│
   │                   │                    │                    │
   │                   │            [if no exact match]          │
   │                   │                    │  findFuzzyMatch()  │
   │                   │                    │───────────────────▶│
   │                   │                    │◀───────────────────│
   │                   │                    │                    │
   │                   │  { answer, conf }  │                    │
   │                   │◀───────────────────│                    │
   │                   │                    │                    │
   │  [conf >= 0.7]    │                    │                    │
   │  Return answer    │                    │                    │
   │◀──────────────────│                    │                    │
   │                   │                    │                    │
   │  [conf < 0.7]     │                    │                    │
   │  Route to L1      │                    │                    │
   │◀──────────────────│                    │                    │
```

#### 1.1.3 Matching Algorithm

```typescript
// Algorithm: FAQ Query Matching
function queryFaq(input: string, category?: string): FaqResponse | null {
  const normalized = input.toLowerCase().trim();

  // Step 1: Exact match on question field
  const exactMatch = db.findOne({
    question: ILike(normalized),
    category: category ?? Any,
    isActive: true
  });

  if (exactMatch) {
    return { ...exactMatch, confidence: 1.0, matchType: 'exact' };
  }

  // Step 2: Fuzzy match on keywords
  const keywords = normalized.split(' ').filter(w => w.length > 2);
  const candidates = db.find({ isActive: true, category: category ?? Any });

  let bestMatch = null;
  let bestScore = 0;

  for (const faq of candidates) {
    const faqText = `${faq.question} ${faq.variations.join(' ')}`.toLowerCase();
    const matchCount = keywords.filter(k => faqText.includes(k)).length;
    const score = matchCount / keywords.length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  // Step 3: Return if above threshold
  const THRESHOLD = 0.7;
  if (bestMatch && bestScore >= THRESHOLD) {
    return { ...bestMatch, confidence: bestScore, matchType: 'fuzzy' };
  }

  // Step 4: Route to L1
  return null;
}
```

---

### 1.2 L1 Chat Module

#### 1.2.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           ChatModule                                 │
├─────────────────────────────────────────────────────────────────────┤
│  imports: [TypeOrmModule.forFeature([ConversationEntity,            │
│                                       MessageEntity])]               │
│  controllers: [ChatController]                                       │
│  providers: [ChatService, ModelProviderFactory]                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌──────────────────┐    ┌────────────────────┐    ┌─────────────────────┐
│  ChatController  │    │    ChatService     │    │ModelProviderFactory │
├──────────────────┤    ├────────────────────┤    ├─────────────────────┤
│ +sendMessage()   │───▶│ +sendMessage()     │───▶│ +getActiveProvider()│
│ +getHistory()    │    │ +getHistory()      │    │ +getHealthyProvider │
│ +escalate()      │    │ +escalateToL2()    │    │ +switchProvider()   │
│ +getModelHealth()│    │ +getModelHealth()  │    │ +getAllHealth()     │
│ +switchModel()   │    │ +switchModel()     │    └─────────┬───────────┘
└──────────────────┘    │ -shouldEscalate()  │              │
                        │ -buildContext()    │    ┌─────────┴───────────┐
                        └────────────────────┘    ▼                     ▼
                                           ┌───────────┐        ┌───────────┐
                                           │<<interface│        │<<interface│
                                           │AIModel    │        │AIModel    │
                                           │Provider>> │        │Provider>> │
                                           └─────┬─────┘        └─────┬─────┘
                                                 │                    │
                    ┌────────────────────────────┼────────────────────┤
                    ▼                            ▼                    ▼
             ┌─────────────┐            ┌─────────────┐      ┌─────────────┐
             │OllamaProvider│            │OpenAIProvider│      │AnthropicProv│
             ├─────────────┤            ├─────────────┤      ├─────────────┤
             │+generate()  │            │+generate()  │      │+generate()  │
             │+healthCheck()            │+healthCheck()      │+healthCheck()
             │+estimateCost()           │+estimateCost()     │+estimateCost()
             └─────────────┘            └─────────────┘      └─────────────┘
```

#### 1.2.2 Interface Contract

```typescript
// AIModelProvider Interface (Nathan's Design)
interface AIModelProvider {
  readonly name: string;

  generateResponse(
    prompt: string,
    context: ConversationContext
  ): Promise<AIResponse>;

  healthCheck(): Promise<boolean>;

  estimateCost(tokens: number): number;
}

interface ConversationContext {
  sessionId: string;
  messages: ChatMessage[];      // Last 10 messages
  metadata?: Record<string, any>;
}

interface AIResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  provider: string;
  latencyMs: number;
}
```

#### 1.2.3 Sequence Diagram - Chat with Fallback

```
Customer      ChatController     ChatService     ProviderFactory    Ollama    OpenAI
   │               │                 │                 │              │          │
   │ POST /chat    │                 │                 │              │          │
   │──────────────▶│                 │                 │              │          │
   │               │ sendMessage()   │                 │              │          │
   │               │────────────────▶│                 │              │          │
   │               │                 │ getHealthy()    │              │          │
   │               │                 │────────────────▶│              │          │
   │               │                 │                 │ healthCheck()│          │
   │               │                 │                 │─────────────▶│          │
   │               │                 │                 │   FAIL ✗     │          │
   │               │                 │                 │◀─────────────│          │
   │               │                 │                 │              │          │
   │               │                 │                 │ [Fallback]   │          │
   │               │                 │                 │ healthCheck()│          │
   │               │                 │                 │─────────────────────────▶│
   │               │                 │                 │   OK ✓                   │
   │               │                 │                 │◀─────────────────────────│
   │               │                 │  OpenAI        │              │          │
   │               │                 │◀────────────────│              │          │
   │               │                 │                 │              │          │
   │               │                 │ generateResponse()             │          │
   │               │                 │───────────────────────────────────────────▶│
   │               │                 │                 │              │          │
   │               │                 │ AIResponse      │              │          │
   │               │                 │◀───────────────────────────────────────────│
   │               │  ChatResponse   │                 │              │          │
   │               │◀────────────────│                 │              │          │
   │  Response     │                 │                 │              │          │
   │◀──────────────│                 │                 │              │          │
```

#### 1.2.4 Escalation Detection Logic

```typescript
// Escalation Phrase Detection
const ESCALATION_PHRASES = [
  'talk to human',
  'speak to agent',
  'agent please',
  'real person',
  'human please',
  'customer service',
  'representative',
];

function shouldEscalate(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return ESCALATION_PHRASES.some(phrase => lowerMessage.includes(phrase));
}

// Sentiment-based escalation (Future)
function detectFrustration(messages: ChatMessage[]): boolean {
  // Count negative sentiment markers
  // Detect repeated questions
  // Identify escalating caps usage
  return false; // Placeholder
}
```

---

### 1.3 L2 Agent Module

#### 1.3.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AgentModule                                 │
├─────────────────────────────────────────────────────────────────────┤
│  imports: [TypeOrmModule.forFeature([AgentEntity, QueueEntryEntity])│
│  controllers: [AgentController]                                      │
│  providers: [AgentService]                                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
┌───────────────────────┐                    ┌─────────────────────────┐
│   AgentController     │                    │     AgentService        │
├───────────────────────┤                    ├─────────────────────────┤
│ +login(dto)           │───────────────────▶│ +login(dto)             │
│ +logout(agentId)      │                    │ +logout(agentId)        │
│ +updateStatus(dto)    │                    │ +updateStatus()         │
│ +getQueueStatus()     │                    │ +addToQueue()           │
│ +getQueuePosition()   │                    │ +getQueuePosition()     │
│ +assignNext(dto)      │                    │ +getQueueStatus()       │
│ +getAllAgents()       │                    │ +assignNextToAgent()    │
│ +createAgent(dto)     │                    │ +createAgent(dto)       │
└───────────────────────┘                    │ +findAllAgents()        │
                                             └───────────┬─────────────┘
                                                         │
                               ┌─────────────────────────┴─────────────┐
                               ▼                                       ▼
                    ┌─────────────────────┐             ┌───────────────────────┐
                    │    AgentEntity      │             │   QueueEntryEntity    │
                    ├─────────────────────┤             ├───────────────────────┤
                    │ id: UUID            │             │ id: UUID              │
                    │ email: string       │             │ conversationId: UUID  │
                    │ passwordHash: string│             │ customerId: string    │
                    │ name: string        │             │ priority: number      │
                    │ status: AgentStatus │             │ status: QueueStatus   │
                    │ currentChats: UUID[]│             │ assignedAgentId: UUID │
                    │ maxConcurrentChats  │             │ createdAt: Date       │
                    │ skills: string[]    │             │ assignedAt: Date      │
                    │ lastActiveAt: Date  │             └───────────────────────┘
                    └─────────────────────┘
```

#### 1.3.2 State Machine - Agent Status

```
                          ┌───────────────────┐
                          │                   │
              ┌───────────┤     OFFLINE       │◀──────────────┐
              │           │                   │               │
              │           └─────────┬─────────┘               │
              │                     │                         │
              │                     │ login()                 │
              │                     ▼                         │
              │           ┌───────────────────┐               │
              │           │                   │               │
              │    ┌─────▶│     ONLINE        │◀─────┐        │
              │    │      │                   │      │        │
              │    │      └─────────┬─────────┘      │        │
              │    │                │                │        │
              │    │    assignChat()│      completeChat()     │
              │    │                ▼                │        │
              │    │      ┌───────────────────┐      │        │
              │    │      │                   │      │        │
              │    └──────│      BUSY         │──────┘        │
              │           │  (has active chats)               │
              │           └───────────────────┘               │
              │                     ▲                         │
              │                     │                         │
              │           setStatus('away')                   │
              │                     │                         │
              │           ┌────────┴──────────┐               │
              │           │                   │               │
              └───────────│      AWAY         │───────────────┘
                          │  (no new assigns) │   logout()
                          └───────────────────┘
```

#### 1.3.3 Queue Assignment Algorithm

```typescript
// Queue Assignment Logic (Garrett's Design)
async function assignNextToAgent(agentId: string): Promise<QueueEntry | null> {
  // Step 1: Validate agent capacity
  const agent = await db.findAgent(agentId);
  if (agent.currentChats.length >= agent.maxConcurrentChats) {
    throw new Error('Agent at max capacity');
  }

  // Step 2: Get next queue entry (priority DESC, createdAt ASC)
  const nextEntry = await db.findOne({
    where: { status: 'waiting' },
    order: { priority: 'DESC', createdAt: 'ASC' },
  });

  if (!nextEntry) {
    return null; // Queue empty
  }

  // Step 3: Atomic assignment (transaction)
  await db.transaction(async (tx) => {
    // Update queue entry
    nextEntry.status = 'assigned';
    nextEntry.assignedAgentId = agentId;
    nextEntry.assignedAt = new Date();
    await tx.save(nextEntry);

    // Update agent
    agent.currentChats.push(nextEntry.conversationId);
    agent.status = 'busy';
    agent.lastActiveAt = new Date();
    await tx.save(agent);
  });

  return nextEntry;
}
```

---

### 1.4 Metrics Module

#### 1.4.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MetricsModule                                │
├─────────────────────────────────────────────────────────────────────┤
│  imports: [TypeOrmModule.forFeature([SessionMetricsEntity,          │
│             DailyAgentSummaryEntity, ReportConfigEntity])]           │
│  controllers: [MetricsController]                                    │
│  providers: [MetricsService]                                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
┌───────────────────────┐                    ┌─────────────────────────┐
│  MetricsController    │                    │     MetricsService      │
├───────────────────────┤                    ├─────────────────────────┤
│ +getDashboard()       │───────────────────▶│ +startSession()         │
│ +getAgentMetrics()    │                    │ +recordFirstResponse()  │
│ +getQueueMetrics()    │                    │ +endSession()           │
│ +getAnalyticsSummary()│                    │ +incrementMessageCount()│
│ +exportAnalytics()    │                    │ +getDashboardMetrics()  │
│ +getReportConfigs()   │                    │ +getAgentMetrics()      │
│ +createReportConfig() │                    │ +getAllAgentsSummary()  │
│ +updateReportConfig() │                    │ +createReportConfig()   │
│ +deleteReportConfig() │                    │ +exportAnalytics()      │
└───────────────────────┘                    └─────────────────────────┘
```

#### 1.4.2 Metrics Calculation Formulas

```typescript
// Agent Efficiency Metrics (Riley's Design)

// First Response Time (FRT)
const FRT = assignedAt - createdAt;  // Queue wait + first message

// Average Handle Time (AHT)
const AHT = resolvedAt - assignedAt;  // Total conversation duration

// Agent Utilization Rate
const utilizationRate = totalActiveTime / totalOnlineTime * 100;

// Customer Satisfaction Score (CSAT)
const CSAT = sum(csatScores) / count(csatScores);  // 1-5 scale

// Deflection Rate (L0 + L1 resolved vs total)
const deflectionRate = (l0Resolved + l1Resolved) / totalQueries * 100;

// Resolution Rate (resolved without transfer)
const resolutionRate = resolvedCount / (resolvedCount + transferredCount) * 100;
```

#### 1.4.3 Daily Report Email Template

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   📊 DAILY AGENT EFFICIENCY REPORT                                  │
│   Date: {date}                                                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   SUMMARY                                                           │
│   ──────────────────────────────────────────────                   │
│   Total Conversations:  {totalConversations}                        │
│   Avg Handle Time:      {avgHandleTime}                             │
│   CSAT Score:           {avgCsat}/5.0                               │
│   Deflection Rate:      {deflectionRate}%                           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   TOP PERFORMERS                                                    │
│   ──────────────────────────────────────────────                   │
│   1. {agent1} - {resolved1} resolved, {csat1} CSAT                  │
│   2. {agent2} - {resolved2} resolved, {csat2} CSAT                  │
│   3. {agent3} - {resolved3} resolved, {csat3} CSAT                  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ⚠️  NEEDS ATTENTION                                               │
│   ──────────────────────────────────────────────                   │
│   - {agentX}: AHT {ahtX}m (target: 5m)                              │
│   - Queue peaked at {peakQueue} customers at {peakTime}             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [View Dashboard]        [Download CSV]                            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      FAQs        │     │   Conversations  │     │    Messages      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ PK id            │     │ PK id            │     │ PK id            │
│    question      │     │    sessionId     │◀────│ FK conversationId│
│    variations[]  │     │    customerId    │     │    role          │
│    answer        │     │ FK agentId       │     │    content       │
│    category      │     │    tier          │     │    tier          │
│    tags[]        │     │    status        │     │    model         │
│    priority      │     │    escalationRsn │     │    provider      │
│    isActive      │     │    createdAt     │     │    tokensUsed    │
│    createdAt     │     │    updatedAt     │     │    latencyMs     │
│    updatedAt     │     │    resolvedAt    │     │    timestamp     │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                                  │ FK
                                  ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     Agents       │     │   QueueEntries   │     │ SessionMetrics   │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ PK id            │◀────│ FK assignedAgent │     │ PK id            │
│    email         │     │ FK conversationId│     │ FK conversationId│
│    passwordHash  │     │    customerId    │     │ FK agentId       │
│    name          │     │    priority      │     │    startedAt     │
│    status        │     │    status        │     │    endedAt       │
│    currentChats[]│     │    createdAt     │     │    FRT           │
│    maxChats      │     │    assignedAt    │     │    AHT           │
│    skills[]      │     └──────────────────┘     │    resolution    │
│    lastActiveAt  │                              │    csatScore     │
│    lastLoginAt   │                              │    messageCount  │
└──────────────────┘                              └──────────────────┘
                                                           │
┌──────────────────┐     ┌──────────────────┐              │
│DailyAgentSummary │     │  ReportConfigs   │              │
├──────────────────┤     ├──────────────────┤              │
│ PK id            │     │ PK id            │              │
│ FK agentId       │     │    name          │              │
│    date          │     │    recipients[]  │              │
│    totalConvs    │     │    schedule      │◀─────────────┘
│    totalHandle   │     │    format        │   Aggregation
│    avgFRT        │     │    metrics[]     │
│    avgAHT        │     │    timezone      │
│    utilization   │     │    isActive      │
│    resolvedCnt   │     │    createdAt     │
│    transferCnt   │     └──────────────────┘
│    avgCsat       │
└──────────────────┘
```

### 2.2 Indexes (Garrett's Recommendation)

```sql
-- Performance-critical indexes
CREATE INDEX idx_faqs_question ON faqs USING gin(to_tsvector('english', question));
CREATE INDEX idx_faqs_category ON faqs(category) WHERE is_active = true;

CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_agents_status ON agents(status) WHERE is_active = true;

CREATE INDEX idx_queue_status ON queue_entries(status);
CREATE INDEX idx_queue_priority ON queue_entries(priority DESC, created_at ASC);

CREATE INDEX idx_metrics_agent_date ON session_metrics(agent_id, started_at);
CREATE INDEX idx_metrics_conversation ON session_metrics(conversation_id);
CREATE INDEX idx_daily_agent_date ON daily_agent_summaries(agent_id, date);
```

---

## 3. API Contracts

### 3.1 L0 FAQ API

```yaml
# POST /api/v1/query
Request:
  query: string (required)
  category: string (optional)

Response (Match):
  success: true
  tier: "L0"
  data:
    id: uuid
    question: string
    answer: string
    confidence: number (0.7 - 1.0)
    matchType: "exact" | "fuzzy" | "semantic"

Response (No Match):
  success: false
  tier: "L0"
  routeTo: "L1"
  message: string
```

### 3.2 L1 Chat API

```yaml
# POST /api/v1/chat
Request:
  message: string (required)
  sessionId: string (optional)
  customerId: string (optional)

Response:
  sessionId: uuid
  message:
    role: "assistant"
    content: string
    timestamp: datetime
    tier: "L1"
    model: string
  tier: "L1"
  tokensUsed: number
  model: string
  provider: string
  latencyMs: number

# Escalation Response:
  success: true
  message: string
  tier: "L2"
```

### 3.3 L2 Agent API

```yaml
# POST /api/v1/agents/login
Request:
  email: string
  password: string

Response:
  success: true
  agent:
    id: uuid
    email: string
    name: string
    status: "online"
    currentChats: uuid[]
    maxConcurrentChats: number
  token: string

# POST /api/v1/queue/assign
Request:
  agentId: uuid

Response (Success):
  success: true
  conversationId: uuid
  message: string

Response (Empty Queue):
  success: false
  message: "No customers waiting"
```

### 3.4 Metrics API

```yaml
# GET /api/v1/metrics/dashboard
Response:
  totalActiveChats: number
  queueDepth: number
  avgWaitTime: number
  onlineAgents: number
  utilizationRate: number
  todayResolved: number
  todayCsat: number

# GET /api/v1/analytics/summary?startDate=X&endDate=Y
Response:
  - agentId: uuid
    agentName: string
    totalConversations: number
    avgHandleTime: number
    avgFirstResponseTime: number
    resolvedCount: number
    csatScore: number
```

---

## 4. Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `FAQ_NOT_FOUND` | 404 | FAQ entry not found |
| `SESSION_NOT_FOUND` | 404 | Chat session not found |
| `AGENT_NOT_FOUND` | 404 | Agent not found |
| `INVALID_CREDENTIALS` | 401 | Login failed |
| `AGENT_AT_CAPACITY` | 400 | Agent has max concurrent chats |
| `QUEUE_EMPTY` | 200 | No customers in queue (not error) |
| `MODEL_UNAVAILABLE` | 503 | All AI providers down |
| `VALIDATION_ERROR` | 400 | Invalid request payload |

---

## 5. Configuration

### 5.1 Model Configuration (models.config.ts)

```typescript
export const ModelConfig = {
  // ========== CHANGE THIS TO SWAP MODELS ==========
  provider: 'ollama',  // 'ollama' | 'openai' | 'anthropic' | 'cohere'

  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
    options: { temperature: 0.7, maxTokens: 2048 }
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    options: { temperature: 0.7, maxTokens: 2048 }
  },

  fallback: {
    enabled: true,
    order: ['ollama', 'openai', 'anthropic']
  }
};
```

### 5.2 Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=chatbot
DB_PASSWORD=chatbot_password
DB_DATABASE=chatbot_db

# AI Models
OLLAMA_BASE_URL=http://localhost:11434
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Application
NODE_ENV=development
PORT=3000
```

---

## Approvals

| Role | Name | Status |
|------|------|--------|
| Platform Lead | Sarah | ✅ Approved |
| Feature Lead | Marcus | ✅ Approved |
| Senior Engineer | Alex | ✅ Approved |
| Senior Engineer | Jordan | ✅ Approved |
| Senior Engineer | Riley | ✅ Approved |
| Principal (Infra) | Garrett | ✅ Approved |
| Principal (App) | Nathan | ✅ Approved |
