# PR Review: Feature - WebSocket Gateway

**PR**: #102
**Author**: River (SDE-2)
**Reviewers**: Nathan (Principal), Sarah (Lead)
**Status**: Approved ✅

## Summary
Implements `ChatGateway` using Socket.io for real-time bi-directional communication.
- Namespace: `/chat`
- Auth: JWT extraction from handshake headers
- Events: `join_room`, `leave_room`, `send_message`

## Review Comments

### Nathan (Principal)
> **[Architecture]** Good use of `JwtService` for connection validation.
> **Question**: How do we handle scaling horizontally? Socket.io default adapter stores rooms in memory.
> **River**: I've added a NOTE to switch to Redis Adapter in Sprint 2-B. For now (single instance), memory is fine.
> **Nathan**: Ack. Ensure `docker-compose` has Redis ready for that switch.

### Sarah (Lead)
> **[Code Quality]** Typo in constructor injection fixed?
> **River**: Yes, fixed `readonlyjwtService` -> `readonly jwtService`.
> **[Security]** Are we rate-limiting socket connections?
> **River**: Not yet. Added to backlog (BUG-003) to add `ThrottlerGuard` for WS.

## Outcome
**Approved** for merge into `release/1.0.0` with non-blocking feedback tracked.
