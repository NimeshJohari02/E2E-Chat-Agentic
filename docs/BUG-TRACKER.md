# Bug Tracker

**Status**: Active
**Lead**: Quinn (QA Lead)
**Priorities**: P0 (Blocker), P1 (Critical), P2 (Major), P3 (Minor)

## Workflow
1. **Open**: Bug identified by QA/Dev.
2. **Triaged**: Assigned to Dev by Lead (Sarah/Marcus).
3. **Fixed**: Dev pushes fix to branch.
4. **Verified**: QA verifies fix + regression check.
5. **Closed**: Fix merged and deployed.

---

## Active Bugs
*(None)*

---

## Resolved Bugs

### [FIXED] Race Condition: Concurrent Agent Assignment
- **ID**: BUG-001
- **Severity**: P1
- **Reporter**: Avery (SDET)
- **Resolution**: Implemented pessimistic database lock (`SELECT FOR UPDATE`) within a transaction in `assignNextToAgent`.
- **Date**: 2026-01-13

### [FIXED] Memory Leak in WebSocket Gateway
- **ID**: BUG-002
- **Severity**: P2
- **Reporter**: Ellis (SDET)
- **Resolution**: Corrected access to Socket.IO namespace sockets map in `cleanupStaleConnections` (`this.server.sockets` instead of `this.server.sockets.sockets`).
- **Date**: 2026-01-13
