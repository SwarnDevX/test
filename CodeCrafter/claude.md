# Master Prompt — Build a Production-Grade Online Coding Judge (LeetCode-equivalent)

> Paste everything below this line into Claude Code (or Cursor / Aider / any agent). Edit the bracketed `[BRAND_NAME]` and any other personal details before pasting.

---

## 1. Mission

You are building a production-grade competitive programming and interview-prep platform called **[BRAND_NAME]** with feature parity to LeetCode. This is **not** a tutorial clone. Every feature listed must be fully implemented end-to-end (DB → API → UI → tests), not stubbed or mocked. Treat this as a real product that will host real users solving real problems with their real code being executed safely on your servers.

When you are unsure about a design decision, prefer the choice that scales, is testable, and matches what a senior engineer at a product company (Atlassian, Razorpay, Flipkart) would ship.

---

## 2. Mandatory Tech Stack

Do not substitute these unless I explicitly approve.

**Backend**
- Java 21 (use records, pattern matching, virtual threads where appropriate)
- Spring Boot 3.3+ (Web, Security, Data JPA, WebSocket, Validation, Actuator)
- Spring Security 6 with JWT (access + refresh tokens) and OAuth2 (Google, GitHub)
- Hibernate / JPA with Flyway for migrations
- MapStruct for DTO mapping, Lombok allowed but minimal
- JUnit 5, Mockito, Testcontainers, RestAssured

**Data**
- PostgreSQL 16 — primary store
- Redis 7 — cache, session blacklist, rate limiting, leaderboards (sorted sets), submission queue counters
- RabbitMQ — submission job queue
- MinIO (S3-compatible) — editorial images, user avatars, exported submission archives
- PostgreSQL full-text search initially; leave a clean abstraction so Elasticsearch can swap in later

**Code Execution**
- Docker (engine-level, not Docker-in-Docker)
- One isolated container per submission, prebuilt language images (gcc, openjdk, python, node, go, rust)
- `seccomp` profile, no-network namespace, read-only rootfs, tmpfs `/tmp` with size limit
- Resource limits: CPU (cgroup), memory (cgroup), pids (anti fork-bomb), wall-clock timeout, output size cap

**Frontend**
- Next.js 14 (App Router), TypeScript strict mode
- Tailwind CSS + shadcn/ui component library
- Monaco Editor (with language servers for syntax/intellisense)
- TanStack Query for server state, Zustand for UI state
- Recharts for stats, hand-rolled SVG for the activity heatmap (GitHub-style)
- next-auth on the client paired with the JWT backend

**Infra & Ops**
- Docker Compose for local dev (postgres, redis, rabbitmq, minio, judge-worker, api, web)
- GitHub Actions CI (build, test, lint, integration tests via Testcontainers, Docker image push)
- Prometheus + Grafana dashboards (request latency, queue depth, submission verdict mix, judge worker utilization)
- Loki for logs, OpenTelemetry tracing
- Production target: Kubernetes manifests (Deployments, HPA on judge workers, NetworkPolicies)

---

## 3. High-Level Architecture

```
[ Next.js Web ] ──► [ Spring Boot API ] ──► [ PostgreSQL ]
                          │   │
                          │   ├─► [ Redis ]  (cache, rate limit, leaderboard)
                          │   └─► [ MinIO ]  (assets)
                          │
                          ▼
                   [ RabbitMQ submissions queue ]
                          │
                          ▼
                  [ Judge Worker pool (Java) ]
                          │
                          ▼
            [ Dockerd → ephemeral sandbox containers ]
                          │
                          ▼
                  [ verdict → API → WebSocket → UI ]
```

Submissions are **never** judged synchronously inside the request thread. The API persists a `Submission` row in `QUEUED` state, publishes a job to RabbitMQ, and immediately returns `submissionId`. The client subscribes to `/ws/submissions/{id}` for live verdict updates (QUEUED → RUNNING → testcase progress → final verdict).

---

## 4. Feature Specification — implement every section

### 4.1 Authentication & Profile
- Email+password signup with verification email (use MailHog locally)
- OAuth2 login via Google and GitHub
- JWT access (15 min) + refresh (7 days), refresh rotation, refresh token reuse detection
- Forgot password flow
- Profile page with: avatar, display name, username (immutable after first set), bio, location, company, school, github/linkedin/twitter links, languages preferred
- Public profile at `/u/{username}` showing everything below

### 4.2 Activity & Stats (the profile dashboard)
- GitHub-style contribution heatmap (last 365 days). Cell color intensity = number of accepted submissions that day. Hover tooltip shows count + date. Click filters submissions by date.
- Solved-by-difficulty donut (Easy / Medium / Hard with totals and percentages)
- Solved-by-tag bar chart
- Current streak and longest streak (consecutive days with at least one accepted submission)
- Languages used (with percent breakdown)
- Recent AC submissions list (last 20)
- Badges section (see 4.10)
- Ranking number (global rank derived from a weighted score across difficulty + contests)

### 4.3 Problem List
- Paginated, server-side filterable table at `/problems`
- Columns: status (Solved/Attempted/Todo), title, acceptance rate, difficulty, frequency (mock metric), tags
- Filters: difficulty, status, tags (multi), companies (multi), search by title or number, premium-only toggle
- Sort by: number, title, difficulty, acceptance, frequency
- "Pick One" random button (respects current filters)
- URL state syncs with filters so links are shareable

### 4.4 Problem Detail Page (`/problems/{slug}`)
Three-pane layout (resizable splitters):
- **Left pane** — tabbed: Description / Editorial / Solutions / Submissions / Discuss / Notes
- **Right pane top** — Monaco editor with language selector, theme switcher (vs-dark, light, high-contrast), font size, vim/emacs keybindings toggle
- **Right pane bottom** — Console: test case input editor, output panel, verdict panel

Description tab content:
- Markdown body with code blocks and LaTeX (KaTeX) for math
- Examples (input / output / explanation)
- Constraints
- Follow-up questions
- Topic tags (clickable)
- Companies that asked it (clickable, premium-gated)
- Similar problems
- Acceptance rate, submission count, like/dislike

Editor toolbar:
- Run (custom test cases, lighter container, 5s wall clock)
- Submit (full hidden test suite)
- Reset to default code stub
- Format code
- Settings dropdown
- **Stopwatch / Timer** that starts on first keystroke; pausable; persists per problem in localStorage; visible "time on problem" in profile

### 4.5 Code Execution Sandbox (the hard part — get this right)

Build a separate Maven module `judge-worker` that consumes RabbitMQ jobs. For each submission:

1. Pull language image (preheated, never built per submission)
2. Write source file + driver harness to a tmpfs-backed temp dir
3. Run `docker run` with these flags **as a baseline** (tune per language):
   - `--rm`
   - `--network=none`
   - `--read-only`
   - `--tmpfs /tmp:size=64m,exec`
   - `--memory=256m --memory-swap=256m`
   - `--cpus=1.0`
   - `--pids-limit=64`
   - `--cap-drop=ALL`
   - `--security-opt no-new-privileges`
   - `--security-opt seccomp=/profiles/judge.json` (custom profile: deny `mount`, `ptrace`, `setns`, network syscalls)
   - `--user 65534:65534` (nobody)
4. Compile step (separate container, longer timeout, returns COMPILE_ERROR with stderr if it fails)
5. For each hidden test case: stream stdin, capture stdout + stderr, enforce wall-clock and CPU timeout, cap output at 64KB
6. Compare output (strict equality by default; per-problem custom checker for floating point or multiple-answer problems — checker is itself a small Java program in the harness)
7. Aggregate verdict: ACCEPTED, WRONG_ANSWER (with first failing case index + diff), TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED, RUNTIME_ERROR (with signal/exit code), COMPILE_ERROR, OUTPUT_LIMIT_EXCEEDED, INTERNAL_ERROR
8. Persist result, publish WebSocket event, update Redis leaderboard, increment user stats, award badges if thresholds crossed
9. Emit metrics to Prometheus

Languages to support at launch: Java, Python 3, C++, JavaScript (Node), Go, C, Rust. Each language has its own driver harness in `judge-worker/harnesses/`.

### 4.6 Submissions History
- `/problems/{slug}/submissions` shows the user's own submissions for that problem
- Columns: status, language, runtime, memory, timestamp
- Click row → modal with full source code, syntax highlighted, copy button, "load into editor" button
- Global `/submissions` page across all problems

### 4.7 Editorial & Community Solutions
- Editorial is a long-form markdown article authored in an admin panel. Supports collapsible "Approach 1 / Approach 2 / Approach 3" sections, complexity analysis, embedded animations (GIF/MP4 from MinIO)
- Community Solutions tab: users post their own write-ups. Markdown editor, upvotes/downvotes, sort by hot/new/most votes
- Comment threads on each solution (one level of nesting)

### 4.8 Discuss Forum
- Per-problem discussion threads + a global forum at `/discuss` with categories (Interview Experiences, Career, Compensation, General)
- Threaded replies, upvotes, mark-as-answer for question threads, rich markdown
- Search across discussions
- User reputation derived from solution + post upvotes

### 4.9 Study Plans / Patterns
- Curated paths: "Top Interview 150", "Blind 75", "Sliding Window Pattern", "Two Pointers", "Graph BFS/DFS", "Dynamic Programming Patterns", "System Design Primer", "SQL 50", etc.
- Each plan is an ordered list of problems with progress bar, days remaining, daily quota
- Admin panel to create/edit plans
- A plan completion grants a badge

### 4.10 Badges & Achievements
- "100 Days Streak", "First Hard Solved", "Polyglot (solved in 3+ languages)", "Night Owl", "Speed Demon (AC under 5 min)", "Pattern Master: Sliding Window", contest-based badges
- Badges shown on profile, hoverable for unlock date and description

### 4.11 Daily Challenge
- One problem promoted daily (admin-scheduled)
- Banner on home page
- Bonus points for solving on the day
- Streak resets if a day is missed

### 4.12 Contests
- Weekly and biweekly contests
- Contest page with countdown, problem set (locked until start)
- Real-time leaderboard (Redis sorted set) — rank by problems solved, tie-break by time + penalty
- Post-contest rating change (use a simplified Elo or Glicko-2)
- Past contests archive with virtual contest mode
- User rating graph on profile

### 4.13 Search
- Global search bar (cmd-K) across problems, users, discussions, tags
- Debounced, paginated, keyboard-navigable

### 4.14 Premium / Subscription (scaffolding only)
- Feature-flag premium-only content (company tags, certain editorials, mock interview)
- Stripe integration in test mode
- Subscription model with monthly / annual

### 4.15 Admin Panel
- Separate route group, RBAC-gated (`ROLE_ADMIN`)
- CRUD for problems, test cases, editorials, study plans, contests, daily challenge schedule
- Test case upload via JSON or zip
- Re-judge button per problem (regrade all submissions if test cases changed)
- User moderation (ban, mute, delete posts)

---

## 5. Data Model (Postgres — design before writing code)

Create these tables with Flyway migrations. Include indexes for every column used in `WHERE`, `ORDER BY`, or joins. Use UUIDv7 or bigint identity for primary keys (pick one and be consistent).

`users`, `user_profiles`, `user_stats` (denormalized counts), `roles`, `user_roles`, `refresh_tokens`, `oauth_accounts`,
`problems`, `problem_tags`, `tags`, `problem_companies`, `companies`, `problem_examples`, `test_cases` (hidden), `sample_test_cases` (visible), `problem_languages` (per-language starter code + driver),
`submissions` (with verdict, runtime_ms, memory_kb, language, source_code_s3_key, testcases_passed, total_testcases, failing_testcase_index, stdout, stderr),
`editorials`, `solutions` (community), `solution_votes`, `comments`, `comment_votes`,
`discussions`, `discussion_replies`, `discussion_votes`,
`study_plans`, `study_plan_problems`, `user_study_plan_progress`,
`badges`, `user_badges`,
`contests`, `contest_problems`, `contest_submissions`, `contest_ratings`,
`daily_challenges`,
`notifications`,
`audit_log`.

Write the ER diagram as a Mermaid block in `docs/schema.md` before writing the migrations.

---

## 6. API Design

- All endpoints under `/api/v1`
- RESTful, plural nouns, kebab-case where applicable
- Pagination: `?page=0&size=20&sort=createdAt,desc`
- Errors: RFC 7807 problem-details JSON
- All write endpoints rate-limited per user via Redis token bucket
- OpenAPI 3 spec generated by springdoc, served at `/api/docs`
- WebSocket: STOMP over SockJS, topic `/topic/submissions/{userId}` and `/topic/contest/{id}/leaderboard`

---

## 7. Security Requirements (non-negotiable)

- Argon2id for passwords (not bcrypt)
- CSRF protection on session-based endpoints; JWT endpoints exempted but require explicit `Authorization` header
- All user input validated server-side with Bean Validation; never trust the client
- Markdown rendering server-side using a sanitizing renderer (no `<script>`, no `javascript:` URIs)
- SQL injection: only JPA / parameterized queries, zero string concatenation
- The judge sandbox MUST satisfy: no network, no filesystem writes outside tmpfs, no privilege escalation, no host PID visibility, kernel syscall filter applied. Add an integration test that runs malicious code (fork bomb, network probe, file write to `/`) and asserts it is neutralized.
- Rate limits: 5 submissions/minute per user, 30 runs/minute, 100 API reads/minute (unauthenticated tighter)
- Secrets via environment variables, never committed; provide `.env.example`

---

## 8. UI / UX Requirements

- Dark mode default, light mode toggle, persists per user
- Fully keyboard-navigable (cmd-K palette, j/k navigation on lists, ?  to show shortcuts)
- All pages responsive down to 375px
- Skeleton loaders, never blank flashes
- Optimistic UI for votes, bookmarks, notes
- Toasts for async actions
- Empty states with helpful CTAs (not just "no data")
- Accessibility: WCAG 2.1 AA, semantic HTML, ARIA where needed, focus visible, color-contrast checked

The visual identity should feel modern and editorial — closer to Linear or Vercel than to LeetCode's slightly dated UI. Use a tasteful neutral palette with a single accent color.

---

## 9. Build Phases (do them in this order, do not skip ahead)

**Phase 0 — Repo & infra (Day 1–2)**
Monorepo with `backend/`, `web/`, `judge-worker/`, `infra/`, `docs/`. Docker Compose runs everything. CI green on an empty Spring Boot health endpoint and a Next.js landing page.

**Phase 1 — Auth + Profile shell (Day 3–6)**
Signup, login, JWT refresh, OAuth2, profile CRUD, public profile page with placeholder stats.

**Phase 2 — Problems + Editor + Run (Day 7–14)**
Problem schema, problem list, problem detail, Monaco editor, "Run" against sample cases (synchronous, no queue yet — easier to debug sandbox first).

**Phase 3 — Async Submit pipeline (Day 15–22)**
RabbitMQ, judge worker, full sandbox hardening, WebSocket verdict streaming, submissions history. **This is the project's centerpiece — spend time here.**

**Phase 4 — Stats, heatmap, badges (Day 23–27)**
User stats denormalization, activity heatmap, badge engine, streaks.

**Phase 5 — Editorial, solutions, discuss (Day 28–34)**
Markdown pipeline, voting, comments.

**Phase 6 — Study plans + daily challenge (Day 35–38)**

**Phase 7 — Contests + ratings (Day 39–45)**

**Phase 8 — Admin panel + polish (Day 46–50)**

**Phase 9 — Load test + observability + deploy (Day 51–55)**
k6 load test: 500 concurrent users, target 100 RPS on submissions with p99 < 2s end-to-end (excluding code runtime itself). Document the numbers in the README.

---

## 10. Testing Requirements

- Unit tests for every service class (>70% line coverage)
- Integration tests with Testcontainers (Postgres, Redis, RabbitMQ spun up real)
- End-to-end tests with Playwright covering: signup → solve a problem → see it on profile heatmap
- A dedicated security test suite for the sandbox (fork bomb, network probe, file escape, infinite loop, memory bomb — each must be neutralized within limits)
- Load test scripts in `infra/loadtest/` using k6

---

## 11. Documentation Requirements

- `README.md` at root: what it is, screenshots, architecture diagram, how to run locally in one command, env vars, load test numbers
- `docs/architecture.md` with sequence diagrams (Mermaid) for submission flow, auth flow, contest flow
- `docs/schema.md` with ER diagram
- `docs/api.md` linking to the live OpenAPI page
- `docs/security.md` documenting the sandbox threat model and mitigations
- `docs/runbook.md` for ops (how to add a language, how to re-judge, how to handle a stuck queue)
- ADRs (Architecture Decision Records) in `docs/adr/` for every non-obvious choice

---

## 12. How I want you to work

- After reading this prompt, **do not start coding immediately**. First reply with a numbered plan for Phase 0 and Phase 1 only, and a list of clarifying questions. I will approve.
- At the end of each phase, stop and summarize what was built, what's tested, and any deviations from this spec with reasoning. Wait for my approval before starting the next phase.
- When you hit a design decision worth recording, write an ADR before implementing.
- Write tests alongside code in the same commit, not as a follow-up.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- Use feature branches, open a PR per phase, include a checklist of acceptance criteria from this spec.
- Never invent tech outside the stack in section 2 without asking.
- If something in this spec is ambiguous or you think a different approach is better, flag it in your reply with a recommendation — don't just guess.

---

## 13. Starting Instruction

Begin by reading the entire spec, then output:
1. A repo layout tree
2. Phase 0 + Phase 1 detailed task list (each task < 2 hours)
3. Clarifying questions (max 10, ranked by importance)
4. Any concerns about feasibility or scope

Do not write code until I approve the plan.