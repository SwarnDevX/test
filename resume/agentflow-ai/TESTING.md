# AgentFlow AI — Testing Guide

## Quick Start

```bash
# 1. Install dependencies and initialize the database (run once)
npm run setup

# 2. Start the development server
npm run dev
```

Open http://localhost:3000

---

## Environment Setup

Before testing, check `.env.local`:

| Variable | Required | Effect if missing |
|---|---|---|
| `OPENAI_API_KEY` | Optional | App runs in **demo mode** — all AI responses are simulated |
| `DATABASE_URL` | Required | Defaults to `file:./data/agentflow.db` (SQLite) |
| `REDIS_URL` | Optional | Falls back to in-memory session store |
| `NEXT_PUBLIC_APP_URL` | Required | Set to `http://localhost:3000` for local dev |

**Demo mode** works without any API key and produces realistic fake responses. Use it to test the full UI/UX flow without billing.

---

## 1. Database Verification

Run this to confirm Prisma is set up and the SQLite database is accessible:

```bash
npm run db:studio
```

This opens Prisma Studio at http://localhost:5555. You should see tables:
- `ChatSession` / `ChatMessage`
- `Workflow` / `WorkflowRun` / `WorkflowRunStep`
- `KbDocument` / `KbChunk`
- `AgentTrace` / `AgentTraceStep`
- `ObsEvent`

If the studio fails to open, run:
```bash
npm run db:push
```

---

## 2. API Health Checks (curl / browser)

Test each API endpoint before using the UI. Replace `localhost:3000` if your port differs.

### Chat Sessions
```bash
# List sessions
curl http://localhost:3000/api/chat/sessions

# Create session
curl -X POST http://localhost:3000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Session"}'
```

Expected response:
```json
{ "sessions": [] }          // GET
{ "id": "...", "title": "Test Session", ... }  // POST
```

### Chat Stream (Server-Sent Events)
```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, what can you do?"}'
```

You should see a stream of `data: {...}` lines ending with `data: {"type":"agent:complete",...}`.

### Knowledge Base
```bash
# List documents
curl http://localhost:3000/api/knowledge

# Upload a text file
curl -X POST http://localhost:3000/api/rag/upload \
  -F "file=@/path/to/test.txt"

# Query knowledge base
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What does the document say?","topK":5}'
```

### Workflows
```bash
# List workflows
curl http://localhost:3000/api/workflows

# Create workflow
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name":"My Test Workflow","nodes":[],"edges":[]}'
```

### Observability
```bash
curl "http://localhost:3000/api/observability?range=24h"
```

### Debug Traces
```bash
curl http://localhost:3000/api/debug/traces
```

---

## 3. UI Feature Tests

### 3.1 Chat Page (`/chat`)

**Golden path:**
1. Open `/chat`
2. Click **New Chat**
3. Type a message (e.g., `Summarize the key benefits of multi-agent AI`) and press Enter
4. Watch the streaming status bar show `Starting agent... → Creating execution plan... → Executing... → Validating...`
5. After completion, verify the assistant response appears with:
   - Confidence percentage badge
   - Token count
   - Latency in seconds
   - Agent execution trace (click the chevron to expand)

**Edge cases to verify:**
- Sending an empty message is blocked (button stays disabled)
- Shift+Enter creates a newline (does not submit)
- Clicking **New Chat** clears messages and creates a new session
- Selecting a previous session from the left sidebar loads its messages
- If OPENAI_API_KEY is not set, demo response still appears (no crash)

**Expected errors to NOT see:**
- HTTP 500 on `/api/chat/sessions`
- HTTP 500 on `/api/chat/stream`
- `agent:complete` event missing from stream

---

### 3.2 Knowledge Base Page (`/knowledge`)

**Golden path:**
1. Open `/knowledge`
2. Drag and drop a `.txt`, `.pdf`, or `.csv` file onto the upload zone, or click to browse
3. Card appears with status **Processing** with a loading animation
4. After 1–3 seconds, status changes to **Ready** with a green badge and chunk count (e.g., `12 chunks`)
5. Type a query in the search box (e.g., `What is the main topic?`) and click **Search**
6. Results appear with document name, relevance score, and matching text excerpt

**Edge cases to verify:**
- Uploading a file with an unsupported extension (e.g., `.exe`) shows no card (filtered client-side)
- Clicking the trash icon on a document removes it instantly
- Search with no documents returns empty results gracefully (no crash)
- Refreshing the page re-loads all previously uploaded documents

**What to check in database:**
- Prisma Studio → `KbDocument` table should show uploaded docs with `status: embedded`
- `KbChunk` table should have rows with `embedding` JSON

---

### 3.3 Workflow Builder Page (`/workflows`)

**Golden path:**
1. Open `/workflows`
2. A default "Revenue Analysis Pipeline" workflow loads in the canvas with 5 nodes
3. The workflow name shows in the input at the top; status badge shows **active** or **draft**
4. Click **+ LLM Node** button to add a new LLM node — it appears in the canvas
5. Drag the node to reposition it
6. Connect two nodes by dragging from the right handle of one to the left handle of another
7. Click **Save** — status badge updates to **active**
8. Click **Run** — the run panel slides in, nodes highlight green as they complete, and the log shows results

**Edge cases to verify:**
- Clicking **New Workflow** (or saving with no existing workflow) creates a new entry in the sidebar
- Clicking a different workflow in the list loads its nodes and edges
- Deleting a workflow removes it from the list
- Running a workflow with no nodes completes immediately with 0 steps

**What to check if Run button does nothing:**
- Open browser DevTools → Network tab → look for `POST /api/workflows/{id}/run`
- Should return a `text/event-stream` response
- Events should include `node_start`, `node_done`, and `completed` types

---

### 3.4 Observability Page (`/observability`)

**After running at least one chat message:**
1. Open `/observability`
2. Top metric cards show **Total Requests**, **Tokens Used**, **Avg Latency**, **Cost**
3. The 24-hour bar chart shows activity spikes corresponding to agent calls
4. **Recent Events** table shows rows with agent name, tokens, latency, cost
5. **Recent Traces** table shows completed agent traces with status **completed** in green

**Toggle time ranges:**
- Switch between **24h**, **7d**, **30d** — metrics update accordingly
- The bar chart always shows 24 data points regardless of range

---

### 3.5 Debug Traces Page (`/debug`)

1. Open `/debug`
2. List of `AgentTrace` records with status, token counts, and latency
3. Click a trace to expand and see the step-by-step breakdown (planner → executor → validator)
4. Each step shows the input/output JSON, tokens, and latency

---

## 4. End-to-End Integration Test

This is the full flow that exercises every system component:

1. **Upload a document** to the knowledge base (e.g., a company FAQ txt file)
2. Wait for status to show **Ready**
3. **Start a chat** and ask a question that relates to the document content
4. The agent should:
   - Plan → create a step with `search_knowledge_base` tool
   - Execute → retrieve relevant chunks (verify in the agent trace)
   - Validate → produce a response citing the document
5. Check **Observability** — request count increased, tokens recorded
6. Check **Debug Traces** — new trace with 3 steps (planner, executor, validator)
7. **Create a workflow** with an LLM node → Save → Run
8. Run panel shows node highlights and completion log

---

## 5. Common Issues & Fixes

### `PrismaClientInitializationError` or database error on startup

```bash
npm run db:push
# then restart:
npm run dev
```

### Chat stream returns immediately with no events

Check that the server is running via `tsx server.ts` (not `next dev`). The app needs a custom server for Socket.IO:
```bash
npm run dev   # this runs: tsx server.ts
```

### Workflow nodes don't load (empty canvas on existing workflow)

This was caused by the old API returning Prisma raw objects without `nodes`/`edges`. The fix is in `app/api/workflows/route.ts`. Confirm by running:
```bash
curl http://localhost:3000/api/workflows
```
Response should include `"nodes": [...]` and `"edges": [...]` — not just `"definition": "..."`.

### Workflow run panel shows nothing / no events

The SSE event types were mismatched. After the fix, `POST /api/workflows/{id}/run` should return events with `type: "node_start"`, `type: "node_done"`, and `type: "completed"`. Confirm in DevTools → Network → EventStream tab.

### Knowledge search returns no results after uploading

If `OPENAI_API_KEY` is not set, a deterministic hash-based embedding is used (demo mode). Results will still appear but ranked by keyword overlap. For accurate semantic search, set a real API key and re-upload.

### Uploads fail silently

Check the browser console for errors on `POST /api/rag/upload`. If the form data has no `file` field, it returns `400`. Make sure the FormData key is `"file"`.

---

## 6. Logging

The app logs to `server.log` in the project root when running via `npm run dev`. Tail it for real-time errors:

```bash
# Windows PowerShell
Get-Content server.log -Wait -Tail 50

# Git Bash / WSL
tail -f server.log
```

Key log prefixes to watch:
- `[RAG Upload] Error:` — document processing failures
- `PrismaClientKnownRequestError` — database constraint violations
- `OPENAI_API_KEY` error — missing key, running in demo mode

---

## 7. Test Checklist

| Feature | Endpoint | Pass? |
|---|---|---|
| List chat sessions | GET /api/chat/sessions | ☐ |
| Create chat session | POST /api/chat/sessions | ☐ |
| Send message + stream | POST /api/chat/stream | ☐ |
| Load session messages | GET /api/chat/sessions/:id/messages | ☐ |
| List KB documents | GET /api/knowledge | ☐ |
| Upload document | POST /api/rag/upload | ☐ |
| Query knowledge base | POST /api/rag/query | ☐ |
| Delete document | DELETE /api/knowledge/:id | ☐ |
| List workflows | GET /api/workflows | ☐ |
| Create workflow | POST /api/workflows | ☐ |
| Update workflow | PUT /api/workflows/:id | ☐ |
| Run workflow (SSE) | POST /api/workflows/:id/run | ☐ |
| Delete workflow | DELETE /api/workflows/:id | ☐ |
| Observability metrics | GET /api/observability | ☐ |
| Debug traces | GET /api/debug/traces | ☐ |
