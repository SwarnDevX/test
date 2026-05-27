# FlowForge

> Visual workflow automation platform — Linear × Vercel aesthetic, n8n power, VectorShift RAG capabilities.

A production-grade, full-stack monorepo with a real-time DAG execution engine, 60+ integrations, AI/LLM nodes, RAG pipelines, sandboxed code execution, and a stunning canvas editor.

---

## Architecture

```
flowforge/
├── apps/
│   ├── web/        Next.js 15 App Router — canvas editor + marketing
│   ├── api/        Fastify + tRPC — REST/WS backend
│   └── worker/     BullMQ — DAG executor + node runners
├── packages/
│   ├── db/         Prisma schema (25 models) + pgvector + seed
│   ├── shared/     Types, Zod schemas, crypto utils
│   ├── nodes-sdk/  Plugin SDK — register new nodes by dropping a file
│   └── ui/         Design system — OKLCH tokens, 20+ components, Storybook
├── tests/
│   └── e2e/        Playwright specs (auth, workflow, execution, deploy, RAG)
├── docker-compose.yml
├── turbo.json
└── playwright.config.ts
```

**Data flow:**

```
Browser (Next.js)
  ↕ tRPC over HTTP / Socket.IO for streaming
Fastify API
  ↕ Prisma
PostgreSQL 16 + pgvector
  ↕ BullMQ jobs
Redis 7
  ↕ job handlers
Worker (DAG executor)
  ↕ external APIs / LLMs / sandboxed code
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker + Docker Compose

### 1. Clone & install

```bash
git clone https://github.com/yourorg/flowforge.git
cd flowforge
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, REDIS_URL, ENCRYPTION_MASTER_KEY
```

### 3. Start infrastructure

```bash
docker compose up -d postgres redis minio mailhog
```

### 4. Database setup

```bash
pnpm db:generate   # generate Prisma client
pnpm db:push       # push schema to Postgres (creates pgvector extension)
pnpm db:seed       # seed 10 example workflows
```

### 5. Run dev servers

```bash
pnpm dev
# web   → http://localhost:3000
# api   → http://localhost:3001
# worker starts automatically
```

---

## Key URLs (dev)

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API (tRPC) | http://localhost:3001/trpc |
| API docs (Swagger) | http://localhost:3001/docs |
| MinIO console | http://localhost:9001 (minioadmin/minioadmin) |
| MailHog | http://localhost:8025 |
| Storybook | `pnpm --filter=@flowforge/ui storybook` → http://localhost:6006 |

---

## Plugin SDK — Adding a New Node

Drop a file in `apps/worker/src/nodes/<category>/my-node.ts`:

```ts
import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "integration.myservice.doThing",   // unique type id
  category: "INTEGRATION",
  label: "MyService: Do Thing",
  description: "Does a thing on MyService",
  icon: "Zap",                             // Lucide icon name
  color: "oklch(65% 0.18 200)",
  inputs:  [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [{ name: "result", label: "Result", type: "JSON" }],
  parameters: [
    { name: "credentialId", label: "MyService credential", type: "string", default: "" },
    { name: "endpoint",     label: "Endpoint",             type: "string", default: "" },
  ],
  executor: async (ctx) => {
    const cred = await ctx.getCredential(String(ctx.params.credentialId));
    const endpoint = ctx.resolveExpression(String(ctx.params.endpoint));
    // call your API
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${cred.apiKey}` },
      signal: ctx.signal,
    });
    return { result: await res.json() };
  },
});
```

Then import your file in `apps/worker/src/nodes/integrations/index.ts`:

```ts
import "./my-node.js";
```

That's it. The node appears in the canvas editor automatically on next restart.

### Executor context (`ctx`) API

| Method / Property | Description |
|-------------------|-------------|
| `ctx.params` | Raw parameter values as configured by the user |
| `ctx.resolveExpression(expr)` | Resolves `{{node.output}}` template expressions |
| `ctx.getCredential(id)` | Decrypts and returns credential fields |
| `ctx.env` | Filtered env vars (no secrets) available to the node |
| `ctx.logger` | Pino logger — emits to execution logs |
| `ctx.signal` | AbortSignal — respect it for cancellable nodes |
| `ctx.emit(event)` | Emit a custom ExecutionEvent (e.g. streaming chunks) |

---

## Node Categories

| Category | Count | Examples |
|----------|-------|---------|
| TRIGGER | 12 | Manual, Webhook, Schedule, Email, Slack, GitHub |
| LOGIC | 14 | If/Else, Loop, Filter, Wait, Math, Regex |
| DATA | 12 | HTTP Request, SQL, MongoDB, Redis, Google Sheets |
| AI / LLM | 16 | Chat Completion, Embeddings, RAG Pipeline, Image Gen |
| AGENTS | 5 | ReAct, Tool-Calling, Multi-Agent, Memory |
| CODE | 5 | JavaScript (isolated-vm), Python (Pyodide), TypeScript |
| INTEGRATION | 21+ | Slack, GitHub, Stripe, HubSpot, Notion, Airtable… |
| OUTPUT | 6 | Chatbot deploy, Form deploy, API endpoint, Slack bot |

---

## Design System

Built on OKLCH color tokens with 6 surface elevations. Run Storybook to browse all components:

```bash
pnpm --filter=@flowforge/ui storybook
```

Key tokens:

```css
--bg-base        /* oklch(9% 0.01 260)  — darkest, canvas bg */
--bg-surface-1   /* oklch(12% 0.01 260) — card */
--accent         /* oklch(65% 0.18 240) — electric blue */
--success        /* oklch(72% 0.17 145) — green */
--danger         /* oklch(62% 0.22 25)  — red */
```

---

## Testing

```bash
# Unit + integration (Vitest)
pnpm test

# E2E (Playwright) — requires dev servers running
pnpm test:e2e

# E2E headed (see browser)
pnpm test:e2e --headed

# Specific spec
pnpm test:e2e tests/e2e/workflow.spec.ts
```

---

## Docker / Production

```bash
# Full stack
docker compose up -d

# Build production images
docker compose -f docker-compose.prod.yml build

# Scale workers
docker compose up -d --scale worker=4
```

Environment variables required in production:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `ENCRYPTION_MASTER_KEY` | 32-byte hex key for envelope encryption |
| `NEXTAUTH_SECRET` | Auth.js secret |
| `NEXTAUTH_URL` | Public URL of the web app |
| `S3_ENDPOINT` | MinIO/S3 endpoint |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret |

---

## Development Commands

```bash
pnpm dev              # start all apps
pnpm build            # production build (Turborepo)
pnpm typecheck        # tsc --noEmit across all packages
pnpm lint             # ESLint across all packages
pnpm format           # Prettier
pnpm db:generate      # prisma generate
pnpm db:push          # prisma db push
pnpm db:seed          # seed 10 example workflows
pnpm db:studio        # Prisma Studio GUI
```

---

## Execution Engine

The DAG executor (`apps/worker/src/executors/dag.ts`) runs workflows as directed acyclic graphs:

1. **Topological sort** — Kahn's BFS produces execution layers
2. **Parallel execution** — nodes within a layer run concurrently via `Promise.all`
3. **Per-node retry** — exponential backoff with configurable max attempts
4. **Streaming** — LLM token chunks emitted via Socket.IO `node_stream` events
5. **Cost tracking** — tokens × model price table, stored per `ExecutionStep`
6. **Error branching** — nodes can expose an `error` output port for graceful fallback

---

## Credential Encryption

Credentials are envelope-encrypted (AES-256-GCM):

- A per-credential Data Encryption Key (DEK) encrypts the secret fields
- The DEK is itself encrypted by a master key (`ENCRYPTION_MASTER_KEY`)
- Only the encrypted DEK and encrypted payload are stored in the database
- The raw credential is never logged or returned to the client

---

## License

MIT © FlowForge Contributors
