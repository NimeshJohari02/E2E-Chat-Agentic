# Backend Sprint 3: Optimization & Robustness

**Status**: Ready for Pickup
**Goal**: Harden the system for Production Load (10k concurrent users).

## 1. Quality Assurance (Priority: Critical)
- **[E2E-REGRESSION]** (Reese): Build Full Regression Suite using `supertest`.
  - Scenarios: Guest Login -> Chat -> Agent Assign -> Agent Reply.
  - *Why*: Guarantee no regression on critical flows.
- **[LOAD-TEST-001]** (Ellis): WebSocket Benchmark.
  - Target: 5000 concurrent socket connections.
  - Tool: `k6` + `k6-reporter`.
  - *Why*: Verify Redis Adapter scaling.

## 2. Infrastructure & Performance
- **[DB-INDEX-01]** (Garrett): Implement IVFFlat Index for `pgvector`.
  - *Current*: Sequential scan (slow at >1k rows).
  - *Target*: Index-assisted KNN search.
- **[CACHE-STRATEGY]** (Riley): Redis Caching for Static Data.
  - Endpoints: `GET /faqs`, `GET /agents/online`.
  - *Why*: Reduce DB hits for high-traffic read endpoints.

## 3. Observability
- **[METRICS-EXPORTER]** (Jordan): Prometheus Endpoint (`/metrics`).
  - Metrics: `active_conversations`, `queue_depth`, `api_latency`.
  - *Why*: Real-time monitoring dashboard.
