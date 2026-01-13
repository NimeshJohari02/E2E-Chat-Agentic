# Backend Roadmap & Status

**Last Updated**: 2026-01-13
**Status**: Active

This roadmap consolidates all backend tasks, bugs, and technical debt. It supersedes previous backlogs.

## P0 - Critical & Active Bugs (Immediate Attention)

| Type | ID | Description | Owner | Status |
|------|----|-------------|-------|--------|
| **BUG** | BUG-001 | **Race Condition: Concurrent Agent Assignment**<br>Fix double assignment when multiple agents accept simultaneously. | River | **In Progress** |
| **BUG** | BUG-002 | **Memory Leak in WebSocket Gateway**<br>Fix `activeConnections` map growth on abrupt disconnects. | River | **In Progress** |
| **PERF** | OPT-001 | **N+1 Query in Metrics**<br>Refactor `getAllAgentsSummary` to use single aggregation query. | Riley | **In Progress** |
| **SEC** | SEC-001 | **No Authentication**<br>Implement JWT AuthModule with guards. Agents currently access all endpoints without login. | Jordan | Open |
| **SEC** | SEC-002 | **No Rate Limiting**<br>Add `@nestjs/throttler` to prevent DoS and API cost explosion. | Riley | Open |
| **SEC** | SEC-003 | **No Input Sanitization**<br>Add validation layer to prevent prompt injection. | Morgan | Open |

## P1 - High Priority (This Sprint)

| Type | ID | Description | Owner | Status |
|------|----|-------------|-------|--------|
| **FEAT** | FEAT-001 | **Real-time WebSocket Gateway**<br>Ensure robust WebSocket implementation for L2 Chat. | River | Open |
| **FEAT** | FEAT-002 | **Semantic FAQ Matching**<br>Implement pgvector similarity search for L0. | Morgan | Open |
| **FEAT** | FEAT-003 | **Conversation Context Limit**<br>Implement sliding window (last 10 msgs) to manage token usage. | River | Open |
| **ARCH** | ARCH-001 | **API Versioning**<br>Add `/api/v1` support for contract stability. | Casey | Open |
| **OPS** | OPS-001 | **Request Logging**<br>Add interceptor for request/response logging. | Riley | Open |

## P2 - Medium Priority (Next Sprint)

| Type | ID | Description | Owner | Status |
|------|----|-------------|-------|--------|
| **FEAT** | FEAT-004 | **Email Notifications**<br>Integrate Nodemailer/SendGrid for reports. | Taylor | Backlog |
| **DATA** | DATA-001 | **Daily Metrics Aggregation**<br>Implement cron job for daily summary stats. | Riley | Backlog |
| **FEAT** | FEAT-005 | **Skill-Based Routing**<br>Route chats to agents based on matching skills. | Alex | Backlog |
| **FEAT** | FEAT-006 | **Agent Transfers**<br>Allow agent-to-agent conversation handoff. | Jordan | Backlog |
| **OPS** | OPS-002 | **Health Check Endpoint**<br>Add `/health` endpoint for Load Balancer. | Taylor | Backlog |

## P3 - Technical Debt & Improvements

| Type | ID | Description | Owner | Status |
|------|----|-------------|-------|--------|
| **CODE** | DEBT-001 | Remove unused `dailyRepo` or implement logic. | Riley | Backlog |
| **CONF** | DEBT-002 | Move hardcoded system prompts to Config/DB. | Morgan | Backlog |
| **RES** | DEBT-003 | Add exponential backoff for AI failures. | River | Backlog |
| **SEC** | DEBT-004 | Switch temporary tokens to proper JWTs. | Jordan | Backlog |
| **TEST** | DEBT-005 | Add Supertest E2E suite. | Quinn | Backlog |
| **DB** | DEBT-006 | Setup TypeORM migrations. | Garrett | Backlog |
| **DOCS** | DEBT-007 | Complete Swagger decorators for DTOs. | Taylor | Backlog |
| **PERF** | OPT-002 | **Connection Pooling**<br>Configure `DB_POOL_SIZE` for production. | Garrett | Backlog |
| **PERF** | OPT-003 | **Redis Caching**<br>Cache hot FAQs to reduce DB load. | Riley | Backlog |
