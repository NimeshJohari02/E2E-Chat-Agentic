# PR-006: Fix WebSocket Memory Leak (BUG-002)

**Author**: River (SDE-2)
**Reviewers**: Quinn (QA Lead), Nathan (Principal)
**Status**: In Progress

## Problem Description
As reported in [BUG-002](../BUG-TRACKER.md), the `activeConnections` map in `ChatGateway` grows indefinitely if clients disconnect abruptly (network cut) without sending a proper TCP FIN/RST or if the application logic fails to handle specific disconnect events.
Current implementation:
```typescript
handleDisconnect(client: Socket) {
  this.activeConnections.delete(client.id);
}
```
However, testing shows ghost connections remain.

## Proposed Changes
1.  **Connection Pruning**: Implement a periodic `Interval` to cleanup stale sockets that are no longer in `server.sockets`.
2.  **Deduplication**: Ensure `handleDisconnect` is idempotent.
3.  **Metrics**: Add `active_connections` gauge to Prometheus (via `MetricsService`) to verify leak fix.

## Backwards Compatibility
- [x] YES: Internal cleanup logic only.
- [ ] NO: Breaking change.

## Verification Plan
- **Manual**: Run `k6` load test (10k conns), hard kill clients, observe memory usage.
- **Auto**: Unit test with mocked `server.sockets`.

## Lead Approval
> **Quinn (QA Lead)**:
> "Cleanup interval logic is sound for detecting ghost connections. ID mismatch check between `activeConnections` and `server.sockets` is the correct approach."
> **Verdict**: APPROVED ✅
