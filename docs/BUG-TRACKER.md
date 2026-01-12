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

### [OPEN] Race Condition: Concurrent Agent Assignment
- **ID**: BUG-001
- **Severity**: P1
- **Reporter**: Avery (SDET)
- **Description**: If two agents accept a chat at the exact same millisecond, both might be assigned.
- **Reproduction**:
  1. Create 1 customer ticket.
  2. Have 2 agents call `acceptChat` via WebSocket simultaneously.
- **Expected**: Database lock/atomic update prevents double assignment.
- **Owner**: River (SDE-2)

### [OPEN] Memory Leak in WebSocket Gateway
- **ID**: BUG-002
- **Severity**: P2
- **Reporter**: Ellis (SDET)
- **Description**: `activeConnections` Map grows indefinitely if clients disconnect abruptly (network cut).
- **Reproduction**: Run script connecting 10k clients and forcibly closing TCP socket without handshake.
- **Owner**: River (SDE-2)

---

## Resolved Bugs
*(None yet)*
