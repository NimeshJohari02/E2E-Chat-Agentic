<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
  <h1>E2E Chat Agentic Backend</h1>
</p>

## 📖 Source of Truth
This repository is the backend for the E2E Chat Agentic system. This `README` serves as the central index (The "Book") for all project documentation, processes, and requirements.

### 👥 Team & Process
*   **[Team Roles (Who)](agents.md)** (The Team Persona Definition)
*   **[Team Strategy (Why)](agent_config.md)** (Rationale behind the structure)
*   **[Strict Engineering Protocol](agents.md#strict-engineering-protocol-mandatory)** (Mandatory for all Devs)
*   **[Bug Tracking Workflow](docs/BUG-TRACKER.md)**
*   **[Code Review Process](docs/BE-REVIEW-BACKLOG.md)**

### 📚 Product Requirements (PRDs)
*   **[PRD-001: L0 Static Query Engine](docs/PRD-001-L0-Static-Query-Engine.md)** (FAQ & Embeddings)
*   **[PRD-002: L1 AI Chatbot](docs/PRD-002-L1-AI-Chatbot.md)** (RAG & Model Routing)
*   **[PRD-003: L2 Agent Handoff](docs/PRD-003-L2-Agent-Handoff.md)** (WebSocket & CRM)
*   **[PRD-004: Agent Dashboard](docs/PRD-004-Agent-Efficiency-Metrics.md)** (Metrics & Analytics)
*   **[PRD-005: Observability](docs/PRD-005-Observability.md)** (Monitoring & Logging)

### 🏗 Architecture & Design
*   **[High Level Design (HLD)](docs/HLD-System-Architecture.md)**
*   **[Low Level Design (LLD)](docs/LLD-Detailed-Design.md)**
*   **[Frontend Architecture Contract](docs/FE-ARCHITECTURE.md)** (API Contracts for FE Team)
*   **[Production Guide](docs/PRODUCTION-GUIDE.md)**

### 📝 Change Log & PR Artifacts
*   **[PR-001: TypeScript Standardization](docs/prs/PR-001-TypeScript-Standardization.md)**
*   **[PR-002: WebSocket Gateway](docs/prs/PR-002-WebSocket-Gateway.md)**
*   **[PR-003: pgvector Search](docs/prs/PR-003-pgvector-Search.md)**
*   **[PR-004: Unit Test Coverage](docs/prs/PR-004-Test-Coverage.md)**

---

## 🚀 Getting Started

### Prerequisites
*   Node.js v18+
*   Docker & Docker Compose (for PostgreSQL + pgvector)

### Installation
```bash
$ npm install
```

### Running the Environment
1.  **Start Database (Postgres + pgvector)**
    ```bash
    $ docker-compose up -d
    ```
2.  **Run Application**
    ```bash
    # development
    $ npm run start

    # watch mode
    $ npm run start:dev
    ```

### Testing
**Strict Protocol**: All code must pass compliance with 80% coverage.
```bash
# unit tests
$ npm run test

# test coverage (Must range > 80%)
$ npm run test:cov

# e2e tests
$ npm run test:e2e
```

---

## 🛡 License
Nest is [MIT licensed](LICENSE).
