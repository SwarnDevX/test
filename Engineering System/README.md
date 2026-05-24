# Autonomous Debugging & Self-Healing Code Platform

A production-grade multi-agent AI system that automatically detects, analyzes, fixes, and validates code issues.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Dashboard (:3000)                    │
├─────────────────────────────────────────────────────────────┤
│                  Express API + WebSocket (:4000)              │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Planner  │  Debug   │   Fix    │  Test    │   Reviewer      │
│  Agent   │  Agent   │  Agent   │  Agent   │    Agent        │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│  RAG Layer (Embeddings)  │  Sandbox (Docker)  │  Guardrails  │
├──────────────────────────┴────────────────────┴─────────────┤
│        MongoDB        │    Redis    │     GitHub API         │
└───────────────────────┴─────────────┴───────────────────────┘
```

## Quick Start

```bash
# 1. Install backend
cd backend && npm install

# 2. Install frontend
cd ../frontend && npm install

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit .env with your OPENAI_API_KEY

# 4. Start services (MongoDB + Redis required)
docker compose up mongo redis -d

# 5. Run backend
cd backend && npm run dev

# 6. Run frontend (separate terminal)
cd frontend && npm run dev
```

## Full Docker Deployment
```bash
docker compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ingest/error | Submit error for AI analysis |
| POST | /api/ingest/logs | Bulk parse raw logs |
| GET | /api/issues | List all issues |
| GET | /api/issues/:id | Get issue detail + agent logs |
| POST | /api/issues/:id/approve | Approve fix → create PR |
| POST | /api/issues/:id/reject | Reject fix |
| POST | /api/github/sync | Index repo into RAG |
| POST | /api/github/pr/:issueId | Create PR for fix |
| GET | /api/metrics | Dashboard metrics |
| WS | /ws | Real-time issue updates |

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Database**: MongoDB, Redis
- **AI**: OpenAI GPT-4o, text-embedding-3-small
- **Infra**: Docker, GitHub Actions

