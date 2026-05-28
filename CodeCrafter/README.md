# CodeCrafter

A production-grade competitive programming and interview-prep platform — full feature parity with LeetCode. Built with Java 21, Spring Boot 3.3, Next.js 14, and a Docker-sandboxed judge engine.

> **Status:** All 9 phases complete and production-ready.

---

## Architecture

```
[ Next.js 14 Web ] ──► [ Spring Boot 3.3 API ] ──► [ PostgreSQL 16 ]
                               │   │
                               │   ├─► [ Redis 7 ]   (cache · rate-limit · leaderboard · streaks)
                               │   └─► [ MinIO ]     (avatars · editorials · archives)
                               │
                               ▼
                      [ RabbitMQ submissions queue ]
                               │
                               ▼
                     [ Judge Worker (Java 21) ]
                               │
                               ▼
           [ Docker → isolated sandbox containers ]
            (seccomp · no-network · cgroups · tmpfs)
                               │
                               ▼
                     [ verdict → WebSocket → UI ]
```

Submissions are **never** judged synchronously. The API saves a `QUEUED` submission, publishes to RabbitMQ, and returns `submissionId` immediately. The browser subscribes to `/ws/submissions/{id}` for live verdict streaming.

---

## Features

| Feature | Details |
|---------|---------|
| **Auth** | Email/password (Argon2id) + Google/GitHub OAuth2, JWT access (15 min) + refresh rotation (7 days), refresh reuse detection, email verification, forgot-password |
| **Problems** | 2000+ problems, paginated/filterable by difficulty/tag/company, acceptance rate, random pick, URL-shareable filter state |
| **Editor** | Monaco with language servers, 7 languages (Java/Python/C++/JS/Go/C/Rust), vim/emacs keybindings, theme switcher, stopwatch |
| **Sandbox** | Per-submission Docker container: seccomp profile, `--network=none`, read-only rootfs, tmpfs `/tmp`, memory/CPU/pids cgroups, wall-clock timeout, output size cap |
| **Verdicts** | ACCEPTED · WRONG_ANSWER · TLE · MLE · RTE · COMPILE_ERROR · OUTPUT_LIMIT_EXCEEDED · INTERNAL_ERROR |
| **Stats** | GitHub-style heatmap (365 days), solved-by-difficulty donut, solved-by-tag bar chart, streaks, language breakdown |
| **Badges** | 10+ badges: streak milestones, polyglot, speed demon, pattern master, contest-based |
| **Daily Challenge** | Admin-scheduled daily problem with bonus points and streak tracking |
| **Study Plans** | Blind 75, Top Interview 150, pattern-based plans with progress bars and completion badges |
| **Contests** | Weekly/biweekly contests, real-time leaderboard (Redis), Elo-based rating, virtual contest mode, rating history graph |
| **Editorial** | Long-form markdown editorials with collapsible approaches, KaTeX math, embedded media |
| **Community** | Solution posts, comment threads, upvotes, discussion forum with categories |
| **Admin Panel** | Full CRUD for problems/editorials/contests/plans, test case management, rejudge, user moderation |
| **Observability** | Prometheus custom metrics, Grafana dashboard (12 panels), Loki + Promtail log aggregation, OpenTelemetry tracing |
| **Premium Scaffolding** | Feature-flag gating, Stripe integration (test mode), monthly/annual subscription |

---

## Running Locally (one command)

```bash
cp .env.example .env          # fill in secrets — see table below
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:8080 |
| API docs (OpenAPI) | http://localhost:8080/api/docs |
| RabbitMQ Management | http://localhost:15672 |
| MinIO Console | http://localhost:9001 |
| MailHog (local SMTP) | http://localhost:8025 |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL password |
| `REDIS_PASSWORD` | ✅ | Redis AUTH password |
| `RABBITMQ_PASSWORD` | ✅ | RabbitMQ password |
| `MINIO_ROOT_PASSWORD` | ✅ | MinIO root password |
| `JWT_SECRET` | ✅ | HS512 secret (min 64 chars) |
| `NEXTAUTH_SECRET` | ✅ | NextAuth.js secret |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth2 client secret |
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth2 client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth2 client secret |
| `SMTP_HOST` | ✅ | SMTP host (MailHog locally) |
| `SMTP_PORT` | ✅ | SMTP port |
| `SMTP_USERNAME` | — | SMTP username (prod only) |
| `SMTP_PASSWORD` | — | SMTP password (prod only) |
| `STRIPE_SECRET_KEY` | — | Stripe secret key (test mode) |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook secret |

See [.env.example](.env.example) for the full list with defaults.

---

## Tech Stack

**Backend**
- Java 21 (virtual threads, records, pattern matching)
- Spring Boot 3.3 — Web, Security, Data JPA, WebSocket, Validation, Actuator
- Spring Security 6 — JWT + OAuth2 (Google, GitHub)
- Hibernate / JPA with Flyway migrations
- MapStruct, Lombok (minimal)
- JUnit 5, Mockito, Testcontainers, RestAssured

**Data**
- PostgreSQL 16 — primary store with full-text search
- Redis 7 — cache, session blacklist, rate limiting, leaderboards (sorted sets)
- RabbitMQ 3.13 — submission job queue
- MinIO — S3-compatible object storage

**Frontend**
- Next.js 14 (App Router), TypeScript strict
- Tailwind CSS + shadcn/ui
- Monaco Editor with language servers
- TanStack Query v5, Zustand
- Recharts, hand-rolled SVG heatmap
- NextAuth.js

**Sandbox**
- Docker engine (not DinD)
- Per-language prebuilt images: `gcc:14`, `openjdk:21`, `python:3.12`, `node:20`, `golang:1.22`, `rust:1.78`
- Custom seccomp profile (denies `mount`, `ptrace`, `setns`, network syscalls)
- Cgroup resource limits: 256 MB memory, 1 CPU, 64 pids, 64 MB tmpfs

**Observability**
- Prometheus + Grafana (custom dashboard: submission RPS, p99 latency, verdict distribution, JVM, queue depth)
- Loki + Promtail (log aggregation from Docker containers)
- OpenTelemetry tracing (propagated across API → judge worker)
- Micrometer custom metrics: `submissions_queued_total`, `submission_wait_seconds`, `submissions_inflight`

---

## Load Test Results

Run with k6 against a 3-node Kubernetes cluster (4 vCPU / 16 GB each):

| Metric | Result | Target |
|--------|--------|--------|
| Submission RPS | **102 RPS** | ≥ 100 RPS |
| p50 wait-to-verdict | 87 ms | — |
| p95 wait-to-verdict | 142 ms | — |
| p99 wait-to-verdict | **187 ms** | < 2000 ms |
| Browse p95 | 48 ms | < 500 ms |
| Browse p99 | 94 ms | < 1000 ms |
| Error rate | 0.02% | < 1% |

> Wait-to-verdict excludes code execution time (sandbox runtime). With a Python "hello world" submission the wall-clock p99 is ~1.4 s end-to-end.

Run the load tests yourself:

```bash
# Smoke test (local)
k6 run infra/loadtest/browse.js

# Full suite (set BASE_URL + AUTH_TOKEN)
BASE_URL=https://codecrafter.dev k6 run infra/loadtest/scenarios.js
```

---

## Kubernetes Deployment

Prerequisites: `kubectl` configured, GHCR credentials, cert-manager + ingress-nginx installed.

```bash
# 1. Create secrets (fill in real values first)
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/secrets.yaml      # edit base64 values first!

# 2. Apply all manifests
kubectl apply -f infra/k8s/configmap.yaml
kubectl apply -f infra/k8s/postgres.yaml
kubectl apply -f infra/k8s/redis.yaml
kubectl apply -f infra/k8s/rabbitmq.yaml
kubectl apply -f infra/k8s/api.yaml
kubectl apply -f infra/k8s/judge-worker.yaml
kubectl apply -f infra/k8s/web.yaml
kubectl apply -f infra/k8s/ingress.yaml
kubectl apply -f infra/k8s/network-policies.yaml

# 3. Watch rollout
kubectl -n codecrafter rollout status deployment/api
```

**HPA scaling targets:**

| Workload | Min | Max | Trigger |
|----------|-----|-----|---------|
| API | 2 | 8 | CPU 70% |
| Judge Worker | 2 | 20 | CPU 60% (scale +4/60s) |
| Web | 2 | 6 | CPU 70% |

---

## CI/CD

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `ci.yml` | PR / push | Build, test, lint, Testcontainers integration tests |
| `cd.yml` | push `main` / tag `v*` | Build + push 3 images to GHCR, kubectl deploy, k6 smoke test |

Images are published to `ghcr.io/swarndevx/codecrafter-{api,judge-worker,web}` with tags: `sha-{short}`, branch, semver (on tags), `latest` (main only).

---

## Project Structure

```
CodeCrafter/
├── backend/                  # Spring Boot API (Maven)
│   └── src/main/java/dev/codecrafter/
│       ├── auth/             # JWT, OAuth2, refresh tokens
│       ├── user/             # Profiles, stats, badges
│       ├── problem/          # Problems, test cases, languages
│       ├── submission/       # Submit, run, judge pipeline
│       ├── contest/          # Contests, ratings, leaderboard
│       ├── editorial/        # Editorials, community solutions
│       ├── discuss/          # Forum
│       ├── studyplan/        # Study plans, daily challenge
│       ├── admin/            # Admin panel APIs
│       └── infra/            # Metrics, security, config
├── judge-worker/             # Maven module — RabbitMQ consumer + Docker runner
│   └── src/main/java/dev/codecrafter/judge/
├── web/                      # Next.js 14 frontend
│   └── src/app/
│       ├── (auth)/           # Login, register, OAuth callback
│       ├── problems/         # Problem list + detail + editor
│       ├── contests/         # Contest list + detail
│       ├── study-plans/      # Study plan pages
│       ├── u/[username]/     # Public profile
│       ├── admin/            # Admin panel (role-gated)
│       └── api/              # Next.js API routes (NextAuth)
├── infra/
│   ├── docker/               # Dockerfiles (backend, judge-worker, web)
│   ├── k8s/                  # Kubernetes manifests
│   ├── loadtest/             # k6 scripts
│   ├── grafana/              # Dashboard JSON + datasource provisioning
│   └── promtail/             # Log scraping config
├── docs/
│   ├── architecture.md       # Sequence diagrams (Mermaid)
│   ├── schema.md             # ER diagram (Mermaid)
│   ├── security.md           # Sandbox threat model
│   ├── runbook.md            # Ops runbook
│   └── adr/                  # Architecture Decision Records
├── docker-compose.yml        # Local dev (all services)
├── .env.example
└── README.md
```

---

## Documentation

- [Architecture & Sequence Diagrams](docs/architecture.md)
- [Database Schema (ER Diagram)](docs/schema.md)
- [API Reference](docs/api.md) — also served live at `/api/docs`
- [Security — Sandbox Threat Model](docs/security.md)
- [Ops Runbook](docs/runbook.md)
- [ADRs](docs/adr/)

---

## Security Notes

- Passwords hashed with **Argon2id** (not bcrypt)
- JWT signed with HS512; refresh tokens rotated on each use with reuse detection
- Sandbox: `--network=none`, seccomp (blocks `mount`/`ptrace`/`setns`/network syscalls), read-only rootfs, `--user 65534` (nobody), pids limit 64 (anti fork-bomb)
- All user markdown sanitized server-side (no `<script>`, no `javascript:` URIs)
- Rate limiting: 5 submissions/min, 30 runs/min, 100 API reads/min (per user, Redis token bucket)
- NetworkPolicies in Kubernetes: default-deny-all, selective allow per service pair
- Zero string concatenation SQL — JPA/parameterized queries only

---

## Build Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Repo, infra scaffolding, CI | ✅ Complete |
| 1 | Auth + Profile shell | ✅ Complete |
| 2 | Problems + Editor + Run | ✅ Complete |
| 3 | Async Submit Pipeline | ✅ Complete |
| 4 | Stats, Heatmap, Badges | ✅ Complete |
| 5 | Editorial, Solutions, Discuss | ✅ Complete |
| 6 | Study Plans + Daily Challenge | ✅ Complete |
| 7 | Contests + Ratings | ✅ Complete |
| 8 | Admin Panel + Polish | ✅ Complete |
| 9 | Load Test + Observability + Deploy | ✅ Complete |
