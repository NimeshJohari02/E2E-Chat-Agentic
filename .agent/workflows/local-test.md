---
description: Run local tests before pushing code changes
---

# Local Testing Workflow

All developers must complete these steps before pushing any code changes.

## Prerequisites

Ensure you have the following running:
- Node.js 18+ installed
- Docker Desktop running (for database tests)

## Steps

// turbo
1. Install dependencies (if not already):
```bash
npm install
```

// turbo
2. Start local database (if running integration tests):
```bash
docker-compose up -d
```

// turbo
3. Run linting:
```bash
npm run lint
```

// turbo
4. Run unit tests:
```bash
npm run test
```

// turbo
5. Run E2E tests:
```bash
npm run test:e2e
```

// turbo
6. Build to verify compilation:
```bash
npm run build
```

## Success Criteria

All steps must pass with exit code 0 before pushing.

## Failure Handling

- **Lint errors**: Run `npm run lint:fix` to auto-fix
- **Test failures**: Fix the failing tests before pushing
- **Build errors**: Check TypeScript compilation errors in output

## Notes

- Coverage threshold: 80% minimum
- Run with `--watch` flag during development: `npm run test:watch`
