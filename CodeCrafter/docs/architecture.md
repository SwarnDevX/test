# Architecture

## System Overview

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
                     [ Judge Worker Pool (Java 21) ]
                               │
                               ▼
           [ Docker → isolated sandbox containers ]
                               │
                               ▼
                     [ verdict → WS → UI ]
```

## Submission Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Next.js Web
    participant API as Spring Boot API
    participant RMQ as RabbitMQ
    participant Worker as Judge Worker
    participant Docker as Sandbox Container
    participant WS as WebSocket

    User->>Web: Click Submit
    Web->>API: POST /api/v1/submissions
    API->>API: Validate + persist Submission(QUEUED)
    API->>RMQ: Publish SubmissionJob
    API-->>Web: 202 Accepted { submissionId }
    Web->>WS: Subscribe /topic/submissions/{id}

    RMQ->>Worker: Consume SubmissionJob
    Worker->>WS: RUNNING event
    Worker->>Docker: docker run --rm --network=none ... sandbox
    loop For each test case
        Docker-->>Worker: stdout / exit code / runtime / memory
        Worker->>WS: TestCaseResult event
    end
    Worker->>API: PATCH /internal/submissions/{id} (verdict)
    API->>WS: Final verdict event
    WS-->>Web: Verdict displayed
```

## Auth Flow (Email + Password)

```mermaid
sequenceDiagram
    participant User
    participant Web
    participant API
    participant DB as PostgreSQL
    participant Redis
    participant Mail as MailHog

    User->>Web: POST /auth/register
    Web->>API: POST /api/v1/auth/register
    API->>DB: INSERT user (Argon2id hash)
    API->>Mail: Send verification email
    API-->>Web: 201 Created

    User->>Web: Click email link
    Web->>API: POST /api/v1/auth/verify-email?token=...
    API->>DB: Mark email_verified = true
    API-->>Web: 200 OK

    User->>Web: POST /auth/login
    Web->>API: POST /api/v1/auth/login
    API->>DB: Look up user + verify Argon2id
    API->>Redis: Store refresh token hash
    API-->>Web: { accessToken (15min), refreshToken (7d) }

    Note over Web,API: On expiry
    Web->>API: POST /api/v1/auth/refresh
    API->>Redis: Verify + rotate refresh token
    API-->>Web: New token pair
```

## Contest Flow

```mermaid
sequenceDiagram
    participant User
    participant Web
    participant API
    participant Redis
    participant WS

    User->>API: POST /api/v1/contests/{id}/register
    Note over API: Contest starts (scheduled job)
    API->>WS: Broadcast contest-start event

    User->>API: POST /api/v1/contest-submissions
    API->>Redis: ZADD contest:{id}:leaderboard score userId
    API-->>WS: Leaderboard update event
    WS-->>Web: Real-time rank update

    Note over API: Contest ends
    API->>API: Calculate Elo delta for each participant
    API->>DB: Update contest_ratings
```

## Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| Next.js Web | UI, SSR, OAuth redirect handling, WebSocket client |
| Spring Boot API | Business logic, auth, REST endpoints, WS broker |
| PostgreSQL | Source of truth for all persistent data |
| Redis | Cache, JWT blacklist, rate limiting, leaderboards (sorted sets) |
| RabbitMQ | Decouples submission intake from execution; durable queue |
| Judge Worker | Pulls jobs, orchestrates Docker sandboxes, writes verdicts |
| MinIO | Object storage for avatars, editorials, submission archives |
| Prometheus + Grafana | Metrics and dashboards |

## Sandboxing Strategy

See [security.md](security.md) for full threat model. Summary:

- One container per submission, killed after verdict
- `--network=none` — no outbound network
- `--read-only` rootfs — no filesystem writes
- `--tmpfs /tmp:size=64m,exec` — ephemeral write space
- `--memory=256m --memory-swap=256m` — cgroup memory cap
- `--cpus=1.0` — CPU quota
- `--pids-limit=64` — anti fork-bomb
- `--security-opt seccomp=judge.json` — custom syscall filter
- `--user 65534:65534` (nobody) — no privilege
