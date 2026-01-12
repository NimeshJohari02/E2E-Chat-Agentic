# High Level Design (HLD) - Chatbot Backend System

**Authors**: Sarah (Platform Lead), Marcus (Feature Lead)
**Reviewed By**: Garrett (Principal - Infra), Nathan (Principal - App)
**Version**: 1.0
**Date**: 2026-01-13

---

## 1. Executive Summary

A three-tier Help & Support chatbot system designed to handle customer queries with progressive escalation:
- **L0**: Static FAQ matching (~40% deflection)
- **L1**: AI-powered intelligent responses (~50% of remaining)
- **L2**: Human agent handoff (~10% escalation)

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CUSTOMERS                                      │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY / LOAD BALANCER                       │
│                         (Future: Kong/AWS ALB)                           │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NESTJS APPLICATION                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  L0 FAQ     │  │  L1 Chat    │  │  L2 Agent   │  │  Metrics    │    │
│  │  Module     │  │  Module     │  │  Module     │  │  Module     │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
│         └────────────────┴────────────────┴────────────────┘            │
│                                   │                                      │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │   AI Models     │
│   + pgvector    │    │  (Sessions/     │    │  (Ollama/       │
│                 │    │   Queue)        │    │   OpenAI/       │
│  - FAQs         │    │                 │    │   Anthropic)    │
│  - Agents       │    │  - Conv Cache   │    │                 │
│  - Sessions     │    │  - Queue State  │    │                 │
│  - Metrics      │    │  - Pub/Sub      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 3. Component Architecture

### 3.1 L0 Static Query Engine

**Purpose**: Fast FAQ matching to deflect 40% of queries

```
┌──────────────────────────────────────────────┐
│              L0 FAQ Module                    │
├──────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────────────┐  │
│  │  Controller │───▶│     FAQ Service     │  │
│  └─────────────┘    └──────────┬──────────┘  │
│                                │              │
│         ┌──────────────────────┼──────────┐  │
│         ▼                      ▼          ▼  │
│  ┌─────────────┐    ┌─────────────┐  ┌──────┐│
│  │Exact Match  │    │Fuzzy Match  │  │Vector││
│  │(question)   │    │(keywords)   │  │Search││
│  └─────────────┘    └─────────────┘  └──────┘│
└──────────────────────────────────────────────┘
                         │
                         ▼
              confidence >= 0.7 ?
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   Return Answer          Route to L1
```

### 3.2 L1 AI Chatbot

**Purpose**: Intelligent conversation with configurable AI models

```
┌───────────────────────────────────────────────────────────┐
│                    L1 Chat Module                          │
├───────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────────────────────────┐   │
│  │  Controller │───▶│         Chat Service            │   │
│  └─────────────┘    └──────────────┬──────────────────┘   │
│                                    │                       │
│                     ┌──────────────┴──────────────┐       │
│                     ▼                              ▼       │
│          ┌──────────────────┐           ┌──────────────┐  │
│          │ Model Provider   │           │  Escalation  │  │
│          │    Factory       │           │  Detector    │  │
│          └────────┬─────────┘           └──────────────┘  │
│                   │                                        │
│     ┌─────────────┼─────────────┬─────────────┐           │
│     ▼             ▼             ▼             ▼           │
│ ┌────────┐   ┌────────┐   ┌──────────┐   ┌────────┐      │
│ │ Ollama │   │ OpenAI │   │Anthropic │   │ Cohere │      │
│ │Provider│   │Provider│   │ Provider │   │Provider│      │
│ └────────┘   └────────┘   └──────────┘   └────────┘      │
└───────────────────────────────────────────────────────────┘
```

### 3.3 L2 Agent Handoff

**Purpose**: Queue management and agent routing for escalated queries

```
┌───────────────────────────────────────────────────────────┐
│                   L2 Agent Module                          │
├───────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────────────────────────┐   │
│  │  Controller │───▶│        Agent Service            │   │
│  └─────────────┘    └──────────────┬──────────────────┘   │
│                                    │                       │
│              ┌─────────────────────┼─────────────────┐    │
│              ▼                     ▼                 ▼    │
│     ┌──────────────┐     ┌──────────────┐   ┌───────────┐│
│     │    Auth      │     │    Queue     │   │  Session  ││
│     │   Manager    │     │   Manager    │   │  Manager  ││
│     └──────────────┘     └──────────────┘   └───────────┘│
└───────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│                     Queue Flow                             │
│                                                            │
│   Customer ──▶ [Queue] ──▶ Assignment ──▶ Agent Chat      │
│                   │                           │            │
│                   ▼                           ▼            │
│            Position Update              Resolution/        │
│            to Customer                  Transfer           │
└───────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow

### 4.1 Query Processing Flow

```
┌─────────┐     ┌─────┐     ┌─────┐     ┌─────┐     ┌───────┐
│Customer │────▶│ L0  │────▶│ L1  │────▶│ L2  │────▶│ Agent │
│ Query   │     │ FAQ │     │ AI  │     │Queue│     │       │
└─────────┘     └──┬──┘     └──┬──┘     └──┬──┘     └───────┘
                   │           │           │
                   ▼           ▼           ▼
              Matched?    Resolved?    Assigned?
                   │           │           │
              Yes: ◀─────Yes: ◀─────Yes: ◀───── Human Chat
              Return      Return      Return
              Answer      Response    Position
```

### 4.2 Request Journey Metrics

| Tier | Entry Condition | Exit Conditions | Metrics Captured |
|------|-----------------|-----------------|------------------|
| L0 | All queries | Match ≥0.7 / No match | Query, confidence, response time |
| L1 | L0 fallback | Resolution / Escalation phrase / Error | Tokens, latency, model, cost |
| L2 | L1 escalation | Resolution / Transfer / Abandon | Handle time, FRT, CSAT |

---

## 5. Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Runtime** | Node.js 20+ | LTS, async I/O for chat |
| **Framework** | NestJS 11 | Enterprise patterns, DI, modularity |
| **Database** | PostgreSQL 16 | ACID, pgvector for embeddings |
| **Cache** | Redis 7 | Session state, queue, pub/sub |
| **AI** | Ollama (local), OpenAI, Anthropic | Configurable, fallback chain |
| **ORM** | TypeORM | Entity management, migrations |
| **Validation** | class-validator | Request validation |

---

## 6. Integration Points

### 6.1 External Systems (Future)

| System | Integration Type | Purpose |
|--------|------------------|---------|
| CRM | REST API | Customer history lookup |
| Email | SMTP/SendGrid | Daily reports |
| Analytics | Webhook | Event streaming |
| SSO | OIDC/SAML | Agent authentication |

### 6.2 AI Model Endpoints

| Provider | Endpoint | Protocol |
|----------|----------|----------|
| Ollama | `localhost:11434` | HTTP REST |
| OpenAI | `api.openai.com` | HTTPS REST |
| Anthropic | `api.anthropic.com` | HTTPS REST |

---

## 7. Scalability Considerations

### 7.1 Horizontal Scaling

```
                        Load Balancer
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
      ┌─────────┐        ┌─────────┐        ┌─────────┐
      │ Node 1  │        │ Node 2  │        │ Node 3  │
      └────┬────┘        └────┬────┘        └────┬────┘
           │                  │                  │
           └──────────────────┴──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               PostgreSQL            Redis
               (Primary)            (Cluster)
```

### 7.2 Capacity Planning

| Component | Target Capacity | Scaling Trigger |
|-----------|-----------------|-----------------|
| API Nodes | 1000 req/s per node | CPU > 70% |
| PostgreSQL | 10K concurrent connections | Connection pool saturation |
| Redis | 100K ops/s | Memory > 80% |
| AI Models | Varies by provider | Rate limit approach |

---

## 8. Security Architecture

### 8.1 Authentication Layers

```
┌────────────────────────────────────────────┐
│              Security Layers                │
├────────────────────────────────────────────┤
│  Customer API:                              │
│    - Session-based (cookie/token)           │
│    - Rate limiting per IP                   │
│                                             │
│  Agent API:                                 │
│    - JWT authentication                     │
│    - Role-based access control              │
│    - Session timeout (30 min idle)          │
│                                             │
│  Admin API:                                 │
│    - JWT + MFA (future)                     │
│    - IP whitelist (future)                  │
└────────────────────────────────────────────┘
```

### 8.2 Data Protection

- PII masking in logs
- Encryption at rest (PostgreSQL)
- Encryption in transit (TLS 1.3)
- Audit logging for all agent actions

---

## 9. Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| **Availability** | 99.9% | Uptime monitoring |
| **L0 Latency** | p95 < 100ms | APM |
| **L1 Latency** | p95 < 3s (local), 5s (cloud) | APM |
| **L2 Assignment** | < 5 seconds | Metrics |
| **Data Retention** | 90 days detailed, 2 years aggregated | Policy |

---

## 10. Deployment Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Production Environment                   │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐      ┌─────────────┐      ┌───────────┐  │
│   │   Docker    │      │   Docker    │      │  Docker   │  │
│   │  Compose    │ ───▶ │ Kubernetes  │ ───▶ │   ECS/    │  │
│   │   (Dev)     │      │   (Stage)   │      │   EKS     │  │
│   └─────────────┘      └─────────────┘      └───────────┘  │
│                                                             │
│   Environments:                                             │
│   - local: docker-compose                                   │
│   - staging: single K8s cluster                             │
│   - production: multi-AZ K8s + managed DB                   │
└────────────────────────────────────────────────────────────┘
```

---

## 11. Monitoring & Observability

```
┌────────────────────────────────────────────────────────────┐
│                   Observability Stack                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Metrics ────────▶ Prometheus ────────▶ Grafana           │
│                                                             │
│   Logs ────────────▶ Winston (JSON) ────────▶ ELK/Loki     │
│                                                             │
│   Traces ──────────▶ OpenTelemetry ─────────▶ Jaeger       │
│                                                             │
│   Alerts ──────────▶ Alertmanager ──────────▶ PagerDuty    │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 12. Disaster Recovery

| Scenario | RTO | RPO | Strategy |
|----------|-----|-----|----------|
| Node failure | 30s | 0 | Auto-restart, LB health checks |
| DB failure | 5 min | < 1 min | Streaming replication |
| AZ failure | 15 min | < 5 min | Multi-AZ deployment |
| Region failure | 4 hrs | < 1 hr | Cross-region backup restore |

---

## Approvals

| Role | Name | Status |
|------|------|--------|
| Platform Lead | Sarah | ✅ Approved |
| Feature Lead | Marcus | ✅ Approved |
| Principal (Infra) | Garrett | ✅ Approved |
| Principal (App) | Nathan | ✅ Approved |
