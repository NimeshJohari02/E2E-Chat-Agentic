# PR-008: Prometheus Metrics Endpoint

**Author**: Jordan (SDE-2)
**Reviewers**: Riley (Sr. SDE), Nathan (Principal)
**Status**: In Progress

## Problem Description
Production systems require observability. Currently, there is no standardized `/metrics` endpoint for Prometheus scraping.

## Proposed Changes
1.  **Endpoint**: `GET /metrics` (Prometheus text format).
2.  **Metrics**:
    - `chatbot_active_conversations_total` (Gauge)
    - `chatbot_queue_depth` (Gauge)
    - `chatbot_api_request_duration_seconds` (Histogram)
3.  **Implementation**: Use `prom-client` library.

## Backwards Compatibility
- [x] YES: New endpoint only. No changes to existing APIs.
- [ ] NO: Breaking change.

## Verification Plan
- **Manual**: `curl http://localhost:3000/metrics` and verify Prometheus format.
- **Auto**: Unit test to check metric registration.

## Lead Approval
> **Nathan (Principal)**:
> "Standard Prometheus integration following prom-client patterns. Global module registration is correct. Good metric selection for initial rollout."
> **Verdict**: APPROVED ✅
