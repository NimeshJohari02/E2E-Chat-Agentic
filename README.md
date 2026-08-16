# E2E Chat Agentic

A human-directed coding-agent experiment that explored how role-based AI agents could plan, build, review, and exercise an end-to-end support-chat proof of concept.

The project combines a NestJS backend, PostgreSQL with pgvector, Redis-oriented caching and WebSocket paths, configurable model providers, a small browser chat widget, Docker-backed local services, and a substantial set of product and engineering artifacts.

## The experiment

`Agentic` primarily describes the development process used to create this repository. I defined the product direction and constraints, reviewed the work, and directed coding agents through role-based prompts. The agents planned slices, edited code, ran local Docker services, exercised APIs with command-line and OpenAPI/Postman tooling, reviewed one another's output, and recorded their decisions.

Files such as [`agents.md`](agents.md), [`agent_config.md`](agent_config.md), the PRDs, review backlogs, QA reports, and documents under [`docs/prs`](docs/prs) preserve that experiment. Names such as Garrett, Nathan, Sarah, Marcus, and Quinn are simulated agent personas. Their approvals, titles, sprint records, and sign-offs are process artifacts from the experiment—not claims about a staffed engineering team or a production release.

One later change was also implemented through Google Jules and remains visible in the repository's pull-request and commit history.

This repository is not a runtime multi-agent framework. Its agentic value is the preserved development workflow and the system those coding agents produced under human direction.

## What was built

- L0 FAQ routing with exact, fuzzy, and pgvector-backed semantic matching.
- L1 chat paths with provider implementations for Ollama, OpenAI, and Anthropic.
- L2 human-agent queue, assignment, session, and Socket.IO/WebSocket paths.
- Agent authentication models, operational metrics, Prometheus output, and report configuration APIs.
- PostgreSQL/pgvector and Redis services for local exploration through Docker Compose.
- Swagger/OpenAPI documentation, a Postman collection, local seed/smoke scripts, and a static frontend chat widget.
- PRDs, HLD/LLD documents, review records, and agent-role instructions that show how the experiment evolved.

## Run the verified local flow

### Prerequisites

- Node.js 20 or newer.
- Docker with Docker Compose.
- Ports `5432`, `6379`, and `8090` available.

Install dependencies and start the local data services:

```bash
npm ci
docker compose up -d --wait
```

Start the application in local mock-AI mode:

```bash
PORT=8090 MOCK_AI=true npm run start
```

In another terminal, seed the greeting FAQ and exercise the verified smoke flow:

```bash
bash scripts/seed_data.sh
bash e2e-demo-verify.sh
```

The smoke script checks the database-backed L0 greeting path and the mock semantic-search fallback. Swagger is available at `http://localhost:8090/api/docs`.

To open the static chat widget, serve its directory on port `3001`:

```bash
cd chatbot-frontend
python3 -m http.server 3001
```

Then open `http://localhost:3001`. The widget is configured to call the backend on port `8090`.

When finished, stop the local services. `--volumes` also removes the disposable local database and Redis data:

```bash
docker compose down --volumes
```

## Current snapshot

The repository is preserved as a locally exercised POC, not a deployed or production-hardened service.

Verified on 16 August 2026:

- `npm ci` completes.
- `npm run build` passes.
- The Docker-backed application starts successfully.
- Health, database seeding, L0 greeting, and mock semantic fallback checks pass.
- The current unit suite passes 41 of 52 tests; FAQ cache-injection and agent transaction mocks account for the remaining failures, and Jest retains open handles.
- The E2E Jest suite currently stops at a TypeScript import-resolution error before executing tests.
- Lint debt and dependency security advisories remain in the preserved snapshot.

Authentication and authorization boundaries are incomplete: several agent, FAQ administration, metrics, and report routes are reachable without guards, and local configuration includes development fallback credentials. Use only isolated local values, never reuse the example credentials, and do not deploy this snapshot as-is.

These boundaries do not erase the experiment's result: the local architecture, core data flow, API surface, Docker environment, agent-directed workflow, and working smoke path are all present and inspectable.

## Documentation map

- [`docs/HLD-System-Architecture.md`](docs/HLD-System-Architecture.md) — proposed system architecture.
- [`docs/LLD-Detailed-Design.md`](docs/LLD-Detailed-Design.md) — detailed design produced during the experiment.
- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — original onboarding artifact; some commands and status claims predate the current verification above.
- [`docs/QA-TEST-REPORT.md`](docs/QA-TEST-REPORT.md) — historical agent-generated QA snapshot, retained as experiment evidence.
- [`docs/PRD-001-L0-Static-Query-Engine.md`](docs/PRD-001-L0-Static-Query-Engine.md) through [`docs/PRD-005-Observability.md`](docs/PRD-005-Observability.md) — product requirement artifacts.
- [`docs/prs`](docs/prs) — simulated PR and review records generated by the role-based workflow.

The current status in this README takes precedence over historical readiness, coverage, approval, or production claims inside those preserved artifacts.

## License

Licensed under the [MIT License](LICENSE).
