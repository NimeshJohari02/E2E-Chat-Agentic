---
description: Start the development server for local testing
---

# Start Development Server

Starts the NestJS application in development mode with hot-reload.

## Prerequisites

// turbo
1. Install dependencies:
```bash
npm install
```

// turbo
2. Start database services:
```bash
docker-compose up -d
```

## Steps

// turbo
3. Start development server:
```bash
npm run start:dev
```

## Verification

After server starts, verify:
- Health endpoint: http://localhost:3000/health
- API docs (Swagger): http://localhost:3000/api/docs

## Troubleshooting

- **Port in use**: Kill process on port 3000 or change in `main.ts`
- **Database connection failed**: Ensure docker-compose is running
- **Module not found**: Run `npm install` again
