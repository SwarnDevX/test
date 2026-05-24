# 🚀 Autonomous Growth Engine

> An advanced AI-powered SaaS platform that transforms startup ideas into complete, launch-ready growth systems — instantly.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20TypeScript-blue)
![AI](https://img.shields.io/badge/AI-GPT--4o-green)
![Cache](https://img.shields.io/badge/Cache-Redis-red)
![DB](https://img.shields.io/badge/DB-PostgreSQL-blue)

---

## ✨ What It Does

Paste your startup idea → Get a **complete growth engine** in seconds:

| Output | Details |
|--------|---------|
| 🖥️ **Landing Page** | Hero, features, pricing, testimonials, FAQ — all AI-generated |
| ✍️ **Marketing Copy** | Taglines, cold emails, Twitter bio, ad copy for Google/LinkedIn/FB |
| 🔍 **SEO Strategy** | Primary & long-tail keywords, meta tags, content topics |
| 📈 **Growth Plan** | Channels ranked by priority, KPIs, Week 1 actions, A/B test ideas |
| 🧠 **AI Analytics** | Track user behavior → get AI-powered improvement suggestions |

---

## 🏗️ Architecture

```
autonomous-growth-engine/
├── apps/
│   ├── api/                    # Express + TypeScript backend
│   │   ├── src/
│   │   │   ├── config/         # DB, Redis, OpenAI clients
│   │   │   ├── middleware/     # Auth (JWT), Rate limiting, Error handler
│   │   │   ├── modules/
│   │   │   │   ├── generation/ # AI generation engine (4 parallel LLM calls)
│   │   │   │   ├── analytics/  # Event tracking + AI suggestions
│   │   │   │   └── auth/       # JWT auth, user management
│   │   │   └── cache/          # Redis cache manager
│   │   └── migrations/         # Knex DB migrations
│   └── web/                    # React + TypeScript + Tailwind frontend
│       └── src/
│           ├── components/     # IdeaForm, GenerationResult, Analytics
│           ├── hooks/          # useGenerate, useAnalytics
│           ├── store/          # Zustand state (auth, project)
│           └── pages/          # HomePage
├── docker-compose.yml          # PostgreSQL + Redis
└── .env.example
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| State | Zustand + TanStack Query |
| Backend | Node.js, Express, TypeScript |
| AI | OpenAI GPT-4o (4 parallel calls with structured JSON output) |
| Database | PostgreSQL via Knex.js |
| Cache | Redis (ioredis) — 24h TTL for generations |
| Auth | JWT (bcryptjs hashing) |
| Rate Limiting | express-rate-limit + Redis store (tiered: free 5/hr, pro 60/hr) |
| Validation | Zod schemas for all AI outputs |

---

## 🧠 Advanced Features

### Structured AI Output (Prompt Engineering)
Each AI call uses `response_format: { type: 'json_object' }` with strict JSON schemas validated by Zod. 4 parallel LLM calls run via `Promise.all` for maximum speed.

### Redis Caching Strategy
- Cache key = `sha256(ideaText + type)` — same idea = instant cache hit
- 24-hour TTL for generations, 30-minute TTL for AI suggestions
- `fromCache` flag returned in API responses

### Tiered Rate Limiting
```
Free tier:  5 generations/hour
Pro tier:  60 generations/hour
```
Rate limits stored in Redis per user JWT sub.

### AI-Powered Analytics Suggestions
- Frontend tracks user events (tab views, clicks, downloads)
- `/api/analytics/:id/suggestions` feeds event data back to GPT-4o
- Returns: growth score, insights, improvement actions, A/B test ideas

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL + Redis)
- OpenAI API key

### 1. Clone & Install
```bash
git clone <repo>
cd autonomous-growth-engine
npm install  # installs all workspaces
```

### 2. Configure Environment
```bash
cp .env.example apps/api/.env
# Edit apps/api/.env and add your OPENAI_API_KEY
```

### 3. Start Infrastructure
```bash
docker-compose up -d
```

### 4. Run Database Migrations
```bash
npm run db:migrate
```

### 5. Start Development Servers

**Terminal 1 — API:**
```bash
npm run dev:api
# → http://localhost:4000
```

**Terminal 2 — Web:**
```bash
npm run dev:web
# → http://localhost:5173
```

---

## 📡 API Reference

### Generate Growth Engine
```
POST /api/generate
Content-Type: application/json

{
  "idea": "AI-powered code review tool for GitHub PRs",
  "projectName": "CodeReviewAI"   // optional
}

Response:
{
  "success": true,
  "projectId": "uuid",
  "output": {
    "landingPage": { ... },
    "marketingCopy": { ... },
    "seoKeywords": { ... },
    "growthStrategies": { ... }
  },
  "meta": { "tokensUsed": 8420, "fromCache": false }
}
```

### Get Generation by Project
```
GET /api/generate/:projectId
```

### Track Analytics Event
```
POST /api/analytics/event
{ "projectId": "uuid", "eventType": "cta_click", "payload": {} }
```

### Get AI Improvement Suggestions
```
GET /api/analytics/:projectId/suggestions
```

### Auth
```
POST /api/auth/register  { email, password, name? }
POST /api/auth/login     { email, password }
GET  /api/auth/projects  (requires Bearer token)
```

---

## 🗄️ Database Schema

```sql
users             (id, email, name, hashed_password, tier, timestamps)
projects          (id, user_id, idea_text, project_name, status, timestamps)
generations       (id, project_id, output JSONB, tokens_used, from_cache, timestamps)
analytics_events  (id, project_id, event_type, payload JSONB, timestamps)
```

---

## 🔒 Security

- JWT authentication with configurable expiry
- Bcrypt password hashing (cost factor 12)
- Helmet.js security headers
- CORS configured per environment
- Rate limiting with Redis-backed store
- Input validation with Zod on all endpoints

---

## 📦 Scripts

```bash
npm run dev:api       # Start API in watch mode
npm run dev:web       # Start React app with HMR
npm run build:api     # Compile API TypeScript
npm run build:web     # Build React for production
npm run db:migrate    # Run Knex migrations
npm run db:seed       # Run database seeds
```

