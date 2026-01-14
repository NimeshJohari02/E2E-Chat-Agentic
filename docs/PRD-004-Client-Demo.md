# PRD-004: Client Demo Protocol & Fallbacks

## Objective
Ensure a flawless Client Demo even without live OpenAI/LLM keys. The system must degrade gracefully to Mocks or Human Agents (Scripted).

## 1. Mock Mode (`MOCK_AI=true`)
To prevent `401 AuthenticationError` crashing the flow:
- **Embeddings**: If API Key missing, generate deterministic "dummy" embeddings (e.g., zero-vectors or hashed vectors) to allow code execution to proceed (even if matching is poor).
- **L1 Chat**: If API Key missing, return "This is a Mock AI response for demo purposes."

## 2. Agent Script (`scripts/demo_agent.js`)
If L1 escalates to L2 (due to error or intent), a script must immediately pick it up:
- **Role**: Simulates a human agent.
- **Behavior**:
  1. Login as `agent@example.com`.
  2. Poll `/api/v1/queue` every 2 seconds.
  3. If pending conversation found -> `Assign Next`.
  4. Send Message: "Hello! I am your demo agent. How can I help?"

## 3. Demo Flow (The "Happy Path")
1. **User**: Opens Chat Widget.
2. **User**: Types "Hello".
3. **System**:
   - *Scenario A (AI)*: Mock AI replies "Hello! I am L1 Chatbot."
   - *Scenario B (L2)*: Escalates to Queue -> Script Agent picks up -> Replies "Hello from Agent".
4. **User**: Types "Reset Password" (FAQ).
   - **System**: Returns FAQ answer (Mock embedding match or Exact match).

## 4. Technical Requirements
- Environment Variable: `MOCK_AI=true`
- Script: `node scripts/demo_agent.js`
