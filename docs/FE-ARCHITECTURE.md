# Frontend Architecture Contract

**Authors**: Marcus (Feature Lead - BE), Dylan (Frontend Lead)
**Principals**: Nathan (App Architect)
**Date**: 2026-01-13

---

## Tech Stack (Dylan's Recommendation)

### Core
| Technology | Version | Rationale |
|------------|---------|-----------|
| **Next.js** | 14.x | App router, SSR, API routes |
| **TypeScript** | 5.x | Type safety, shared types with BE |
| **React** | 18.x | Latest features, concurrent rendering |

### State & Data
| Technology | Purpose |
|------------|---------|
| **TanStack Query** | Server state, caching, mutations |
| **Zustand** | Client state (UI, modals) |
| **Socket.io Client** | Real-time chat, queue updates |

### UI
| Technology | Purpose |
|------------|---------|
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Pre-built accessible components |
| **Framer Motion** | Animations |
| **Lucide Icons** | Icon library |

### Testing
| Technology | Purpose |
|------------|---------|
| **Vitest** | Unit tests |
| **Playwright** | E2E tests |
| **MSW** | API mocking |

---

## Component Structure (Charlie - SDE-2)

> **Note**: Frontend lives in separate `frontend/` folder, not `src/`

```
chatbot-anti/
├── src/                    # Backend (NestJS)
├── frontend/               # Frontend (Next.js) - SEPARATE
│   ├── app/                # Next.js App Router
│   │   ├── (customer)/     # Customer-facing routes
│   │   │   └── chat/       # Chat widget
│   │   ├── (agent)/        # Agent dashboard
│   │   │   ├── dashboard/
│   │   │   ├── queue/
│   │   │   └── chats/
│   │   └── (admin)/        # Admin portal
│   ├── components/
│   │   ├── ui/             # shadcn components
│   │   ├── chat/           # Chat-specific
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── ChatWidget.tsx
│   │   ├── queue/          # Queue-specific
│   │   │   ├── QueueList.tsx
│   │   │   └── QueueItem.tsx
│   │   └── dashboard/      # Dashboard-specific
│   │       ├── MetricsCard.tsx
│   │       └── AgentStatus.tsx
│   ├── hooks/              # Custom hooks
│   │   ├── useChat.ts
│   │   ├── useQueue.ts
│   │   └── useWebSocket.ts
│   ├── lib/                # Utilities
│   │   ├── api.ts          # API client (generated from Swagger)
│   │   └── socket.ts       # Socket.io setup
│   └── types/              # Shared types (from BE DTOs)
│       ├── chat.types.ts
│       ├── agent.types.ts
│       └── metrics.types.ts
└── docs/                   # Documentation
```

---

## API Contract (Drew - SDE-2)

### Auto-Generated Types from Swagger

```bash
# Generate TypeScript types from OpenAPI spec
npx openapi-typescript http://localhost:3000/api/docs-json -o src/types/api.d.ts
```

### API Client

```typescript
// src/lib/api.ts
import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';

export const api = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

// Usage
const { data } = await api.POST('/api/v1/chat', {
  body: { message: 'Hello', sessionId: '...' }
});
```

---

## WebSocket Events (River - BE, Ellis - FE)

### Events from Backend → Frontend

| Event | Payload | Description |
|-------|---------|-------------|
| `queue:updated` | `{ totalWaiting, entries[] }` | Queue changed |
| `chat:message` | `{ conversationId, message }` | New message |
| `chat:typing` | `{ conversationId, isTyping }` | Typing indicator |
| `agent:assigned` | `{ conversationId, agentId }` | Agent assigned |
| `status:changed` | `{ agentId, status }` | Agent status change |

### Events from Frontend → Backend

| Event | Payload | Description |
|-------|---------|-------------|
| `chat:send` | `{ conversationId, content }` | Send message |
| `chat:typing` | `{ conversationId }` | User typing |
| `agent:status` | `{ status }` | Change agent status |
| `queue:accept` | `{ entryId }` | Accept from queue |

---

## Authentication Flow (Jordan - BE, Avery - FE)

### Customer (Anonymous)
1. First chat → BE returns `sessionId`
2. Store in localStorage
3. Include in all subsequent requests

### Agent (JWT)
1. Login → BE returns JWT + refresh token
2. Store JWT in httpOnly cookie (or memory)
3. Include in Authorization header
4. Refresh when expired

---

## Design Tokens (Harper → Charlie)

```css
/* Provided by Design team */
:root {
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-gray-50: #f9fafb;
  --color-gray-900: #111827;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
}
```

---

## Sign-off

- [ ] Marcus (BE Lead) - API contracts approved
- [ ] Dylan (FE Lead) - Tech stack approved
- [ ] Nathan (Principal) - Architecture approved
- [ ] Harper (Design) - Design tokens approved
