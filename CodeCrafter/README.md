# CodeCrafter

A production-grade competitive programming and interview-prep platform — feature parity with LeetCode.

> **Status:** Phase 0 complete — infrastructure scaffolding, health endpoint live, landing page deployed.

## Architecture

```
[ Next.js 14 Web ] ──► [ Spring Boot 3.3 API ] ──► [ PostgreSQL 16 ]
                               │   │
                               │   ├─► [ Redis 7 ]   (cache · rate-limit · leaderboard)
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
                               │
                               ▼
                     [ verdict → WS → UI ]
```

## Running Locally (one command)

```bash
cp .env.example .env          # fill in secrets
docker compose up --build
```

| Service        | URL                            |
|----------------|--------------------------------|
| Web app        | http://localhost:3000          |
| API            | http://localhost:8080          |
| API docs       | http://localhost:8080/api/docs |
| RabbitMQ UI    | http://localhost:15672         |
| MinIO console  | http://localhost:9001          |
| MailHog UI     | http://localhost:8025          |

## Tech Stack

- **Backend:** Java 21, Spring Boot 3.3, Spring Security 6, Flyway, Hibernate
- **Data:** PostgreSQL 16, Redis 7, RabbitMQ 3.13, MinIO
- **Frontend:** Next.js 14, TypeScript strict, Tailwind CSS, shadcn/ui, Monaco Editor
- **Sandbox:** Docker (seccomp, cgroups, tmpfs, no-network)
- **Observability:** Prometheus, Grafana, Loki, OpenTelemetry

## Environment Variables

See [.env.example](.env.example) for the full list.

## Documentation

- [Architecture & Sequence Diagrams](docs/architecture.md)
- [Database Schema (ER Diagram)](docs/schema.md)
- [API Reference](docs/api.md)
- [Security — Sandbox Threat Model](docs/security.md)
- [Ops Runbook](docs/runbook.md)
- [ADRs](docs/adr/)

## Build Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Repo, infra, CI | ✅ Done |
| 1 | Auth + Profile | 🔜 Next |
| 2 | Problems + Editor + Run | ⬜ |
| 3 | Async Submit Pipeline | ⬜ |
| 4 | Stats, Heatmap, Badges | ⬜ |
| 5 | Editorial, Solutions, Discuss | ⬜ |
| 6 | Study Plans + Daily Challenge | ⬜ |
| 7 | Contests + Ratings | ⬜ |
| 8 | Admin Panel + Polish | ⬜ |
| 9 | Load Test + Observability + Deploy | ⬜ |

## Load Test Results

_To be populated in Phase 9._

Target: 100 RPS submissions, p99 < 2s (excl. code runtime).
