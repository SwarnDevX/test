# AgentFlow AI — Autonomous Business Workflow Engine

Production-grade multi-agent AI system with RAG pipeline, pluggable tool registry, workflow execution engine, real-time Socket.IO streaming, and full observability.

## Architecture

```
Multi-Agent Orchestration
  Planner Agent    → structured JSON execution plan (GPT-4o)
  Executor Agent   → tool calling + RAG retrieval
  Validator Agent  → confidence scoring + quality check

RAG Pipeline
  Upload (PDF/CSV/TXT/MD) → chunk → embed (text-embedding-3-small) → store
  Query → embed → cosine similarity → top-K retrieval

Tool Registry (pluggable)
  search_knowledge_base · calculate · web_search
  query_database · generate_text · analyze_data

Workflow Engine
  JSON definition → step execution (LLM/API/DB/Condition/Transform/Agent)
  Streaming progress via SSE + Socket.IO

Observability
  Token usage · latency · cost · error rate
  Per-agent trace with full input/output stored in DB
```

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up database
```bash
npm run db:push
```

### 3. Configure environment
Edit `.env.local`:
```env
OPENAI_API_KEY=sk-...          # Required for real AI; runs demo mode without it
DATABASE_URL=file:./data/agentflow.db   # SQLite default (no server needed)
REDIS_URL=                     # Optional Redis; falls back to in-memory store
```

### 4. Start the server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | Prisma ORM + SQLite (swap to PostgreSQL via DATABASE_URL) |
| Memory | Redis / in-memory fallback |
| LLM | OpenAI GPT-4o + text-embedding-3-small |
| Real-time | Socket.IO (bidirectional) + SSE (streaming) |
| UI | React 18 + Tailwind CSS + Framer Motion + ReactFlow |
| Validation | Zod schemas on all agent I/O |

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/stream` | Trigger agent orchestration (SSE) |
| GET/POST | `/api/chat/sessions` | List / create sessions |
| GET | `/api/chat/sessions/:id/messages` | Session message history |
| POST | `/api/rag/upload` | Upload + embed document |
| POST | `/api/rag/query` | Semantic search |
| GET/POST | `/api/workflows` | List / create workflows |
| POST | `/api/workflows/:id/run` | Execute workflow (SSE) |
| GET | `/api/observability` | Metrics dashboard |
| GET | `/api/debug/traces` | Agent execution traces |

## Production Deployment

Switch to PostgreSQL:
```env
DATABASE_URL=postgresql://user:pass@host:5432/agentflow
```

Add Redis for persistent memory:
```env
REDIS_URL=redis://localhost:6379
```

Build and start:
```bash
npm run build
npm start
```

## Demo Mode

Without `OPENAI_API_KEY`, all features work with realistic simulated responses:
- Agent orchestration simulates planning, execution, and validation
- RAG uses keyword-based search (no embeddings needed)
- Tool calls return demo data
