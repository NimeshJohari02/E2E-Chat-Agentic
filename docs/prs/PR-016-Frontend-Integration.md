# PR-016: Frontend Chat Widget Integration

**Author**: Dylan (FE Lead)
**Status**: Planning
**Branch**: `feature/dylan/chat-widget-integration`

## Scope
Integrate the existing `chatbot-frontend` Chat Widget with the verified Backend APIs.

## Changes
- **`chatbot-frontend/app.js`**:
    - Update `API_BASE` to `http://localhost:8090`.
    - Replace mock/incorrect endpoints with verified ones:
        - `POST /api/v1/query` (FAQ)
        - `POST /api/v1/chat` (L1 AI)
    - Implement `localStorage` for Session Persistence.
    - Remove placeholder WebSocket code (use polling/REST for Demo V1 if WS not ready, or wire basic WS if time permits). *Focus: REST First for reliability.*

## Verification
- Widget creates session on first message.
- Widget sends/receives messages.
- Refreshing page retains history (via `localStorage` + `GET /session/:id`).

## Lead Approval
*(Pending)*
