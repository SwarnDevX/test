# AI Static Ad Creative SaaS Platform

> **Build Status: ✅ Production build passes (Next.js 14.2.29)**

A full-stack SaaS platform for generating static image ad creatives using AI. Background images are AI-generated via prompts, while text and branding elements are fully editable layers.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Canvas Editor**: Konva.js / react-konva with layer system
- **State Management**: Zustand (with undo/redo history)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5 (Credentials + Google OAuth)
- **Queue**: BullMQ + Redis (async AI job processing)
- **AI Images**: Stability AI (background generation)
- **AI Copy**: OpenAI GPT-4o (ad copywriting)
- **Storage**: AWS S3 (presigned upload URLs)
- **Payments**: Stripe (subscriptions + webhooks)
- **Email**: Resend

## Quick Start

### 1. Start local services (Docker)

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Edit `.env.local` with your API keys:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Random secret string
- `OPENAI_API_KEY` — For ad copy generation
- `STABILITY_API_KEY` — For background image generation
- `AWS_*` — S3 credentials for asset storage
- `STRIPE_*` — Stripe keys for billing
- `REDIS_URL` — Redis connection (default: redis://localhost:6379)

### 4. Initialize database

```bash
npm run db:push
npm run db:generate
```

### 5. Run development server

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: BullMQ workers (AI job processing)
npm run worker
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                         # Next.js 14 App Router
│   ├── (auth)/                  # Login, Signup, Reset Password
│   ├── (dashboard)/             # Dashboard, Brand Kits, Billing
│   ├── editor/[projectId]/      # Canvas Editor (full-screen)
│   └── api/                     # 18 API route handlers
│       ├── auth/                # Register, NextAuth, Reset
│       ├── projects/            # CRUD + export
│       ├── brand-kits/          # CRUD
│       ├── ai/                  # Background, Copy, Layout, Status
│       ├── assets/              # S3 upload URL
│       ├── credits/             # Balance
│       └── stripe/              # Checkout + Webhook
├── components/
│   ├── editor/
│   │   ├── CanvasStage.tsx      # Konva canvas with all layer types
│   │   ├── LayerPanel.tsx       # Layer list (reorder, show/hide, lock)
│   │   ├── PropertiesPanel.tsx  # Context-aware layer properties
│   │   ├── EditorToolbar.tsx    # Top bar + AI generation panel
│   │   └── ImageUploader.tsx    # Drag-drop image upload to S3
│   └── Providers.tsx
├── lib/
│   ├── auth.ts                  # NextAuth v5 config
│   ├── credits.ts               # Atomic credit deduction
│   ├── prisma.ts                # Prisma singleton
│   ├── redis.ts                 # Redis singleton (lazy connect)
│   ├── s3.ts                    # S3 presigned URLs
│   ├── stripe.ts                # Stripe client + plan config
│   └── utils.ts                 # cn(), debounce(), etc.
├── queues/
│   ├── index.ts                 # Lazy BullMQ queue factory
│   └── workers/
│       ├── backgroundWorker.ts  # Stability AI → S3 → DB
│       └── exportWorker.ts      # Canvas render → S3 → DB
├── store/
│   └── canvasStore.ts           # Zustand canvas state + undo/redo
└── types/
    ├── canvas.ts                # Layer union types + AD_FORMATS
    ├── ai.ts                    # Job payload types
    └── next-auth.d.ts           # Session type augmentation
```

## Features

### Canvas Editor
- **Layer types**: Background (AI/solid), Text, Image/Logo, Shape
- **Layer controls**: Drag, resize, rotate, lock, hide/show, duplicate, reorder
- **Text controls**: Font family, size, weight, color, alignment, line-height, letter-spacing, shadow, stroke, **RTL/LTR direction**
- **Undo/Redo**: Full history stack (Ctrl+Z / Ctrl+Y)
- **Auto-save**: Debounced canvas state persistence to DB
- **Export**: Client-side PNG export via Konva `toDataURL()`

### AI Generation (AI Panel in editor)
- **Background**: Stability AI text-to-image → uploaded to S3 → async via BullMQ
- **Copy**: GPT-4o generates headline/subheadline/CTA variants → apply to canvas
- **Status polling**: 2-second interval polling until job completes

### Credit System
| Plan     | Credits | Price  |
|----------|---------|--------|
| Free     | 10/mo   | $0     |
| Pro      | 100/mo  | $19/mo |
| Business | 500/mo  | $49/mo |

**Credit costs:** Background: 3 · Copy: 1 · Layout: 1 · Export: 1

Credits are deducted atomically using PostgreSQL row-level locking.

### Stripe Billing
- Checkout session creation → Stripe hosted page
- Webhook handler for: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
- Monthly credit refresh on subscription renewal

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| GET/POST | `/api/projects` | List / create projects |
| GET/PATCH/DELETE | `/api/projects/[id]` | Project CRUD |
| POST | `/api/projects/[id]/export` | Queue export job |
| GET/POST | `/api/brand-kits` | List / create brand kits |
| GET/PATCH/DELETE | `/api/brand-kits/[id]` | Brand kit CRUD |
| POST | `/api/ai/background` | Queue background generation |
| POST | `/api/ai/copy` | Generate ad copy (sync) |
| POST | `/api/ai/layout` | Generate layout suggestion |
| GET | `/api/ai/status/[assetId]` | Poll job status |
| POST | `/api/assets/upload` | Get S3 presigned upload URL |
| GET | `/api/credits` | Get credit balance |
| POST | `/api/stripe/checkout` | Create Stripe checkout session |
| POST | `/api/stripe/webhook` | Handle Stripe events |

## Deployment

### With Docker
```bash
docker build -t adcreative-ai .
docker run -p 3000:3000 --env-file .env.local adcreative-ai
```

### On Vercel + Railway/Render
1. Deploy Next.js app on Vercel
2. Deploy BullMQ worker (`npm run worker`) on Railway or Render
3. Use managed PostgreSQL (Neon, Supabase, Railway)
4. Use managed Redis (Upstash, Railway)


A full-stack SaaS platform for generating static image ad creatives using AI. Background images are AI-generated via prompts, while text and branding elements are fully editable layers.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Canvas Editor**: Konva.js / react-konva
- **State Management**: Zustand
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5
- **Queue**: BullMQ + Redis
- **AI**: OpenAI GPT-4o (copy), Stability AI (images)
- **Storage**: AWS S3
- **Payments**: Stripe
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- AWS S3 bucket
- OpenAI API key
- Stability AI API key
- Stripe account

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in your environment variables in `.env.local`

5. Push database schema:
   ```bash
   npm run db:push
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. In a separate terminal, start the queue worker:
   ```bash
   npm run worker
   ```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup, reset)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── editor/[projectId]/ # Canvas editor
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/
│   ├── dashboard/
│   ├── editor/
│   └── ui/
├── lib/                   # Utilities (prisma, auth, stripe, s3)
├── queues/                # BullMQ workers
├── store/                 # Zustand stores
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
```

## Credit System

| Plan     | Credits/Month | Price   |
|----------|---------------|---------|
| Free     | 10            | $0      |
| Pro      | 100           | $19/mo  |
| Business | 500           | $49/mo  |

### Credit Costs

- Background image generation: 3 credits
- Ad copy generation: 1 credit
- Layout suggestion: 1 credit
- Export: 1 credit

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/[...nextauth] | NextAuth endpoints |
| GET/POST | /api/projects | List/Create projects |
| GET/PATCH/DELETE | /api/projects/[id] | Project CRUD |
| POST | /api/projects/[id]/export | Export project |
| GET/POST | /api/brand-kits | List/Create brand kits |
| GET/PATCH/DELETE | /api/brand-kits/[id] | Brand kit CRUD |
| POST | /api/ai/background | Generate background image |
| POST | /api/ai/copy | Generate ad copy |
| POST | /api/ai/layout | Generate layout suggestion |
| GET | /api/ai/status/[jobId] | Check AI job status |
| POST | /api/assets/upload | Get signed upload URL |
| GET | /api/credits | Get credit balance |
| POST | /api/stripe/checkout | Create checkout session |
| POST | /api/stripe/webhook | Stripe webhook handler |
```

