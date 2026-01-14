# PR-017: Demo Resilience (Mock & Script)

**Author**: Support (Fix)
**Status**: Planning
**Branch**: `feature/demo/mock-and-script`

## Scope
Implement fallback mechanisms for Client Demo to ensure 100% flow completion even without live AI keys.

## Changes
- **Backend (`src/common/providers/`)**:
    - Add `MOCK_AI` flag support.
    - If `MOCK_AI=true`:
        - `EmbeddingsService` returns dummy vectors (0.0).
        - `ChatService` (via Provider) returns "Mock Response".
- **Script (`scripts/demo-agent.js`)**:
    - Logic: Login -> Poll Queue -> Assign Next -> Reply.
    - Loop: Runs continuously.

## Verification
- Run backend with `MOCK_AI=true`.
- Run script `node scripts/demo-agent.js`.
- Frontend Chat "Hello" -> Gets L2 escalation (if AI fails) -> Script replies "Hello from Agent".
