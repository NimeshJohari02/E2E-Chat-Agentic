# Backend Code Review - Engineering Task Backlog

**Reviewed By**: Sarah (Platform Lead), Marcus (Feature Lead)
**Principals Consulted**: Garrett (Infra), Nathan (App)
**Date**: 2026-01-13

---

## Executive Summary

Backend implementation is **functional but needs production hardening**. Core flows work, tests pass (40/40), but several gaps exist before shipping.

---

## Critical Issues (P0 - Block Release)

### 1. No Authentication
**Current**: Agents can access all endpoints without login
**Risk**: Anyone can manage queue, view metrics
**Owner**: Jordan (Senior)
**Task**: Implement JWT AuthModule with guards

### 2. No Rate Limiting
**Current**: Unlimited API calls allowed
**Risk**: DoS attacks, cost explosion on AI endpoints
**Owner**: Riley (Senior)
**Task**: Add `@nestjs/throttler` with tier-based limits

### 3. No Input Sanitization
**Current**: Raw user input passed to AI
**Risk**: Prompt injection attacks
**Owner**: Morgan (SDE-2)
**Task**: Add input validation and sanitization layer

---

## High Priority (P1 - Ship Within Sprint)

| # | Issue | Owner | Task |
|---|-------|-------|------|
| 4 | No WebSocket for real-time | River | Implement Socket.io gateway |
| 5 | FAQ matching is basic (no semantic) | Morgan | Add pgvector similarity search |
| 6 | No conversation context limit | River | Implement sliding window (last 10 msgs) |
| 7 | Missing API versioning | Casey | Add `/api/v1`, `/api/v2` support |
| 8 | No request logging | Riley | Add request/response interceptor |

---

## Medium Priority (P2 - Next Sprint)

| # | Issue | Owner | Task |
|---|-------|-------|------|
| 9 | No email for reports | Taylor | Integrate Nodemailer/SendGrid |
| 10 | Daily aggregation unused | Riley | Implement daily metrics cron |
| 11 | No agent skills matching | Alex | Route by agent skills |
| 12 | No conversation transfer | Jordan | Agent-to-agent handoff |
| 13 | Missing health check endpoint | Taylor | Add `/health` for LB |

---

## Tech Debt (P3 - Backlog)

| # | Issue | Owner | Notes |
|---|-------|-------|-------|
| 14 | `dailyRepo` unused | Riley | Implement or remove |
| 15 | Hardcoded system prompts | Morgan | Move to config/DB |
| 16 | No retry on AI failure | River | Add exponential backoff |
| 17 | Password in temp token | Jordan | Switch to proper JWT |
| 18 | Missing E2E tests | Quinn | Add Supertest suite |
| 19 | No DB migrations | Garrett | Setup TypeORM migrations |
| 20 | Missing API docs on DTOs | Taylor | Complete Swagger decorators |

---

## Performance Bottlenecks

### Identified by Garrett (Infra)

1. **N+1 Query in Metrics**
   - `getAllAgentsSummary` loops through agents
   - Fix: Single aggregate query

2. **No Connection Pooling Config**
   - Default pool may be insufficient
   - Fix: Configure `DB_POOL_SIZE` in production

3. **No Redis Caching**
   - FAQ queries hit DB every time
   - Fix: Cache hot FAQs in Redis

### Identified by Nathan (App)

1. **Blocking AI Calls**
   - Long AI responses block thread
   - Fix: Consider queue-based async processing

2. **No Circuit Breaker**
   - All AI calls go to same endpoint
   - Fix: Add circuit breaker pattern for fallback

---

## Sprint Assignments

### Sprint 1: Auth & Security
| Task | Owner | Points |
|------|-------|--------|
| JWT AuthModule | Jordan | 8 |
| Rate Limiting | Riley | 3 |
| Input Sanitization | Morgan | 5 |
| Health Endpoint | Taylor | 2 |
| **Total** | | **18** |

### Sprint 2: Real-time & Performance
| Task | Owner | Points |
|------|-------|--------|
| WebSocket Gateway | River | 8 |
| pgvector Search | Morgan | 8 |
| Redis Caching | Riley | 5 |
| N+1 Query Fix | Riley | 3 |
| **Total** | | **24** |

---

## Sign-off

- [ ] Sarah (Platform Lead) - Reviewed
- [ ] Marcus (Feature Lead) - Reviewed
- [ ] Garrett (Principal - Infra) - Approved architecture
- [ ] Nathan (Principal - App) - Approved patterns
