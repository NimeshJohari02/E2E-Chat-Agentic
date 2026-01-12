# Developer Onboarding Guide

**Author**: Casey (SDE-2 - API Developer)
**Reviewed By**: Sarah (Platform Lead), Marcus (Feature Lead)
**Version**: 1.1 (includes Bypass Mode)
**Date**: 2026-01-13
**Status**: ✅ Tested and Working

---

## 🎯 Overview

Welcome to the **Chatbot Backend** project! This guide will get you from zero to running the entire system locally in under 10 minutes—**completely FREE**.

### What You'll Set Up

| Component | Technology | Cost |
|-----------|------------|------|
| Database | PostgreSQL (Docker) | FREE |
| Cache | Redis (Docker) | FREE |
| AI Model | Ollama (Local LLM) | FREE |
| Backend | NestJS | FREE |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Installation |
|------|---------|--------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **npm** | 9+ | Comes with Node.js |
| **Docker Desktop** | Latest | [docker.com](https://docker.com/products/docker-desktop) |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

### Verify Prerequisites

```bash
# Check Node.js
node --version
# Expected: v18.x.x or higher

# Check npm
npm --version
# Expected: 9.x.x or higher

# Check Docker
docker --version
# Expected: Docker version 24.x.x or higher

# Check Docker Compose
docker compose version
# Expected: Docker Compose version v2.x.x
```

---

## 🚀 Quick Start (5 minutes)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd chatbot-anti
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Database Services

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Verify services are running
docker compose ps
```

Expected output:
```
NAME                STATUS
chatbot-postgres    running (healthy)
chatbot-redis       running (healthy)
```

### Step 4: Start the Development Server

```bash
npm run start:dev
```

Expected output:
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [RoutesResolver] FaqController {/api/v1}:
[Nest] LOG [RoutesResolver] ChatController {/api/v1}:
[Nest] LOG [RoutesResolver] AgentController {/api/v1}:
[Nest] LOG [NestApplication] Nest application successfully started
```

### Step 5: Verify the API

```bash
# Health check
curl http://localhost:3000

# Expected: {"message":"Hello World!"}
```

**🎉 Congratulations! The backend is now running!**

---

## 🤖 Setting Up AI (Optional but Recommended)

For L1 AI chatbot functionality, install Ollama for FREE local LLM inference.

### Install Ollama

**macOS:**
```bash
brew install ollama
```

**Or download from:** [ollama.ai/download](https://ollama.ai/download)

### Pull a Model

```bash
# Pull the default model (llama2 - ~4GB)
ollama pull llama2

# Or use a smaller model for faster testing
ollama pull tinyllama
```

### Start Ollama

```bash
# Start the Ollama server
ollama serve
```

### Update .env for Different Model (Optional)

```bash
# In .env, change:
OLLAMA_MODEL=tinyllama   # Smaller, faster
```

### Verify Ollama

```bash
curl http://localhost:11434/api/tags
# Should list your installed models
```

---

## ⚡ Testing Without AI (Bypass Mode)

**Don't want to install Ollama?** Use bypass mode to skip L1 AI and test L2 agent functionality directly.

### Enable Bypass Mode

In your `.env` file:

```bash
# Set to 'true' to bypass L1 AI chatbot
BYPASS_AI_CHATBOT=true
```

### What Happens in Bypass Mode

When `BYPASS_AI_CHATBOT=true`:
1. All `/api/v1/chat` requests skip L1 AI processing
2. Messages are routed directly to L2 agent queue
3. You'll see this in logs: `🔀 BYPASS MODE: Skipping L1 AI, routing directly to L2 agent queue`

### Test L2 Agent Flow

```bash
# 1. Send a chat message (bypasses AI, goes to L2 queue)
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I need help"}'

# Response (routes to L2):
{
  "success": true,
  "message": "You are being connected to a customer service agent. Please wait.",
  "tier": "L2"
}

# 2. Check queue status
curl http://localhost:3000/api/v1/queue

# 3. Create a test agent
curl -X POST http://localhost:3000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{"email": "agent@test.com", "password": "password123", "name": "Test Agent"}'

# 4. Agent login
curl -X POST http://localhost:3000/api/v1/agents/login \
  -H "Content-Type: application/json" \
  -d '{"email": "agent@test.com", "password": "password123"}'

# 5. Assign next customer in queue
curl -X POST http://localhost:3000/api/v1/queue/assign \
  -H "Content-Type: application/json" \
  -d '{"agentId": "<agent-id-from-step-4>"}'
```

### Disable Bypass Mode

When ready to test with AI:

```bash
# In .env
BYPASS_AI_CHATBOT=false
```

---

## 📁 Project Structure

```
chatbot-anti/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── database.config.ts  # PostgreSQL settings
│   │   └── models.config.ts    # AI model settings ← SWAP MODELS HERE
│   │
│   ├── modules/
│   │   ├── faq/                # L0 - Static FAQ matching
│   │   │   ├── faq.controller.ts
│   │   │   ├── faq.service.ts
│   │   │   ├── faq.service.spec.ts  # Unit tests
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   │
│   │   ├── chat/               # L1 - AI Chatbot
│   │   │   ├── chat.controller.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── providers/      # AI model providers
│   │   │   │   ├── ollama.provider.ts
│   │   │   │   ├── openai.provider.ts
│   │   │   │   └── anthropic.provider.ts
│   │   │   └── ...
│   │   │
│   │   ├── agent/              # L2 - Agent Handoff
│   │   │   └── ...
│   │   │
│   │   └── metrics/            # Efficiency Tracking
│   │       └── ...
│   │
│   ├── app.module.ts           # Main module
│   └── main.ts                 # Entry point
│
├── docs/                       # Documentation
│   ├── PRD-001...005.md        # Product Requirements
│   ├── HLD-System-Architecture.md
│   ├── LLD-Detailed-Design.md
│   └── QA-TEST-REPORT.md
│
├── test/                       # E2E tests
├── .agent/workflows/           # Team workflows
├── docker-compose.yml          # Local services
├── .env                        # Environment config
└── package.json
```

---

## 🔌 API Reference

### Base URL

```
http://localhost:3000/api/v1
```

### L0 - FAQ Query (Static Matching)

```bash
# Query FAQ database
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I reset my password?"}'

# Response (Match found):
{
  "success": true,
  "tier": "L0",
  "data": {
    "question": "How do I reset my password?",
    "answer": "Go to Settings > Security > Reset Password",
    "confidence": 1.0,
    "matchType": "exact"
  }
}

# Response (No match - route to L1):
{
  "success": false,
  "tier": "L0",
  "routeTo": "L1"
}
```

### L1 - AI Chat

```bash
# Send message to AI chatbot
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your business hours?"}'

# Response:
{
  "sessionId": "uuid-here",
  "message": {
    "role": "assistant",
    "content": "Our business hours are...",
    "tier": "L1"
  },
  "provider": "ollama",
  "tokensUsed": 45
}
```

### L1 - Check Model Health

```bash
curl http://localhost:3000/api/v1/models/health

# Response:
{
  "providers": [
    { "provider": "ollama", "isHealthy": true, "isActive": true },
    { "provider": "openai", "isHealthy": false, "isActive": false }
  ]
}
```

### L2 - Agent Login

```bash
curl -X POST http://localhost:3000/api/v1/agents/login \
  -H "Content-Type: application/json" \
  -d '{"email": "agent@test.com", "password": "password123"}'
```

### Metrics Dashboard

```bash
curl http://localhost:3000/api/v1/metrics/dashboard
```

---

## 🧪 Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific module
npm run test -- --testPathPattern=faq

# Run in watch mode (during development)
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Expected Output

```
Test Suites: 5 passed, 5 total
Tests:       40 passed, 40 total
Time:        3.4s
```

---

## 🔧 Common Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start with hot-reload |
| `npm run build` | Build for production |
| `npm run test` | Run unit tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix style issues |
| `docker compose up -d` | Start DB/Redis |
| `docker compose down` | Stop services |
| `docker compose logs` | View service logs |

---

## 🐛 Troubleshooting

### Database Connection Error

**Error:**
```
[TypeOrmModule] Unable to connect to the database
```

**Solution:**
```bash
# 1. Make sure Docker is running
docker compose ps

# 2. If not running, start it
docker compose up -d

# 3. Wait a few seconds for healthy status
docker compose ps
# Should show: chatbot-postgres (healthy)

# 4. Restart the app
npm run start:dev
```

### Ollama Connection Error

**Error:**
```
Ollama request failed: ECONNREFUSED
```

**Solution:**
```bash
# 1. Start Ollama server
ollama serve

# 2. In another terminal, verify it's running
curl http://localhost:11434/api/tags

# 3. Make sure you have a model pulled
ollama pull llama2
```

### Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port in .env
PORT=3001
```

### TypeScript Build Errors

```bash
# Clean and rebuild
rm -rf dist
npm run build
```

---

## 🔄 Development Workflow

### Before Starting Work

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Start services
docker compose up -d

# 4. Start dev server
npm run start:dev
```

### Before Pushing Code

```bash
# 1. Run linter
npm run lint

# 2. Run tests
npm run test

# 3. Build to check for errors
npm run build
```

### Using Team Workflows

```bash
# Run local test workflow
# (See .agent/workflows/local-test.md)

# Run code review workflow
# (See .agent/workflows/code-review.md)
```

---

## 📊 Switching AI Models

To use a different AI provider, edit `src/config/models.config.ts`:

```typescript
export const ModelConfig = {
  // Change this to switch providers:
  provider: 'ollama',  // 'ollama' | 'openai' | 'anthropic'

  // ...
};
```

### Using OpenAI (Paid)

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```
3. Change provider in `models.config.ts`:
   ```typescript
   provider: 'openai',
   ```

---

## 📚 Additional Documentation

| Document | Description |
|----------|-------------|
| `docs/HLD-System-Architecture.md` | High-level architecture |
| `docs/LLD-Detailed-Design.md` | Detailed class/sequence diagrams |
| `docs/PRD-001...005.md` | Product requirements |
| `docs/QA-TEST-REPORT.md` | Test results |
| `docs/TEAM-REVIEW.md` | Code review status |
| `agents.md` | Team personas |

---

## 🆘 Getting Help

1. **Check this guide** for common issues
2. **Check the PRDs** for feature requirements
3. **Check the LLD** for technical details
4. **Ask the team leads** (Sarah or Marcus)

---

*Documentation by Casey (SDE-2) | Reviewed by Sarah (Platform Lead) & Marcus (Feature Lead)*
