# PRD-002: L1 AI Chatbot with Model Routing

**Author**: Sophia (Senior PM - Customer Experience)
**Status**: Draft
**Created**: 2026-01-13
**Target Traffic**: ~50% of incoming queries (fallback from L0)

---

## Executive Summary

L1 AI Chatbot uses local LLM models to provide intelligent responses to queries that L0 cannot handle. The system is designed for **easy model swapping** via configuration, starting with localhost deployments but architected for production LLM APIs.

---

## User Stories

### US-001: AI Query Resolution
**As a** customer
**I want to** get intelligent answers to complex questions
**So that** I can resolve issues without waiting for an agent

**Acceptance Criteria**:
- Contextual conversation support (multi-turn)
- Response time < 3 seconds
- Model selection via single config file change
- Graceful degradation to L2 if model unavailable

### US-002: Model Configuration
**As a** DevOps engineer
**I want to** swap AI models via config file
**So that** I can upgrade/change models without code changes

**Acceptance Criteria**:
- Single file (`models.config.ts`) for all model settings
- Support for: localhost (Ollama), OpenAI, Anthropic, Cohere
- Hot-reload capability for model switching
- Model health check before routing

### US-003: Conversation Context
**As a** customer
**I want to** have a continuous conversation
**So that** I don't have to repeat myself

**Acceptance Criteria**:
- Session-based conversation memory
- Context window management (token limits)
- Conversation summarization for long sessions

### US-004: Escalation to L2
**As a** system
**I want to** detect when AI cannot help
**So that** customers get routed to human agents

**Acceptance Criteria**:
- Sentiment analysis for frustration detection
- Explicit escalation phrases ("talk to human", "agent please")
- Max retry threshold before auto-escalation
- Full conversation context passed to L2

---

## Non-Functional Requirements (NFRs)

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Response Latency | p95 < 3s (local), < 5s (cloud) | APM |
| Model Availability | 99.5% | Health checks |
| Context Retention | Last 10 messages | Session storage |
| Cost per Query | Tracked per model | Cost dashboard |

---

## Success Metrics

- **Resolution Rate**: 80% of L1 queries resolved without L2
- **Customer Satisfaction**: CSAT ≥ 3.8/5.0 for AI responses
- **Escalation Rate**: < 20% to human agents

---

## Technical Specifications

### Model Configuration (Single File Swap)
```typescript
// src/config/models.config.ts
export const ModelConfig = {
  provider: 'ollama',  // 'ollama' | 'openai' | 'anthropic' | 'cohere'

  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
    options: { temperature: 0.7 }
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    options: { temperature: 0.7 }
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-sonnet',
    options: { temperature: 0.7 }
  },

  cohere: {
    apiKey: process.env.COHERE_API_KEY,
    model: 'command',
    options: { temperature: 0.7 }
  },

  fallback: {
    enabled: true,
    order: ['ollama', 'openai', 'anthropic']
  }
};
```

### Service Interface (Nathan's Design)
```typescript
interface AIModelProvider {
  generateResponse(prompt: string, context: ConversationContext): Promise<AIResponse>;
  healthCheck(): Promise<boolean>;
  estimateCost(tokens: number): number;
}

// Factory pattern for easy provider switching
class ModelProviderFactory {
  static create(provider: string): AIModelProvider;
}
```

### API Endpoints
```
POST /api/v1/chat                    - Send message to AI
GET  /api/v1/chat/session/:sessionId - Get conversation history
POST /api/v1/chat/escalate           - Manual escalation to L2
GET  /api/v1/models/health           - Model health status
POST /api/v1/models/switch           - Hot-swap active model (admin)
```

---

## UAT Test Cases (Mia)

| ID | Scenario | Expected Result |
|----|----------|-----------------|
| TC-001 | Simple question to AI | Coherent response < 3s |
| TC-002 | Multi-turn conversation | Context maintained |
| TC-003 | Model unavailable | Fallback to next model |
| TC-004 | All models down | Route to L2 with message |
| TC-005 | User says "talk to human" | Immediate L2 escalation |
| TC-006 | Switch model via config | Next request uses new model |
| TC-007 | Token limit exceeded | Conversation summarized |

---

## Frontend TODO (Placeholder)

- [ ] Chat interface with message bubbles
- [ ] Typing indicator during AI processing
- [ ] "Escalate to Agent" button
- [ ] Model health indicator (admin)
- [ ] Conversation history sidebar

---

## Rollout Strategy

1. **Phase 1**: Internal testing with Ollama (llama2)
2. **Phase 2**: Load testing with simulated conversations
3. **Phase 3**: 10% traffic shadow mode
4. **Phase 4**: Full rollout with fallback chain
