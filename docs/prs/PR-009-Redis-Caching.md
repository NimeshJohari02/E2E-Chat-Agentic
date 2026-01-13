# PR-009: Redis Caching for Static Data

**Author**: Riley (Sr. SDE)
**Reviewers**: Garrett (Principal), Morgan (SDE-2)
**Status**: In Progress

## Problem Description
High-traffic read endpoints (`GET /faqs`, `GET /agents/online`) hit the database on every request. With Redis already integrated for WebSocket scaling, we can leverage it for caching.

## Proposed Changes
1.  **CacheModule**: Create `src/common/cache/cache.module.ts` using `@nestjs/cache-manager` with Redis store.
2.  **Decorator**: Implement `@Cacheable(ttl)` decorator for easy caching.
3.  **Endpoints**:
    - `GET /faqs` → Cache for 5 minutes.
    - `GET /agents/online` → Cache for 30 seconds.

## Backwards Compatibility
- [x] YES: Transparent caching layer. API responses unchanged.
- [ ] NO: Breaking change.

## Verification Plan
- **Manual**: Call endpoint twice, check Redis for key, verify TTL expiry.
- **Metrics**: Track cache hit/miss ratio via Prometheus.

## Lead Approval
> **Garrett (Principal)**:
> "Cache-first pattern implemented correctly. TTL of 5 minutes for FAQs is reasonable. Fallback to in-memory for local dev is a good UX touch."
> **Verdict**: APPROVED ✅
