# PR-007: Redis Adapter for WebSocket Scaling

**Author**: Riley (Sr. SDE)
**Reviewers**: Garrett (Principal - Infra), River (SDE-2)
**Status**: In Progress

## Problem Description
Currently, `ChatGateway` uses the default in-memory adapter. This limits the application to a single instance. If we scale to 2+ pods, users connected to Pod A cannot chat with Agents connected to Pod B.

## Proposed Changes
1.  **Dependency**: Install `@socket.io/redis-adapter` and `redis`.
2.  **Infrastructure**: Configure `RedisIoAdapter` in `main.ts`.
3.  **Config**: Add `REDIS_HOST` and `REDIS_PORT` env vars.

## Backwards Compatibility
- [x] YES: Transparent swap of IO Adapter. Client protocol unchanged.
- [ ] NO: Breaking change.

## Verification Plan
- **Manual**: Spin up 2 backend instances (ports 3000, 3001). Connect Client A to 3000, Agent B to 3001. Verify message delivery.

## Lead Approval
> **Garrett (Principal)**:
> "Adapter implementation follows NestJS standard. Conditional loading in main.ts is smart for dev experience. Ensure Redis secret is managed in production."
> **Verdict**: APPROVED ✅
