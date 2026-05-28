# API Reference

The full interactive API reference is served live by springdoc-openapi at:

**Local:** http://localhost:8080/api/docs  
**Production:** https://api.codecrafter.dev/api/docs

---

## Base URL

All REST endpoints are under `/api/v1`. The OpenAPI spec is available at `/api/v1/api-docs`.

## Authentication

Most write endpoints and user-specific endpoints require a JWT bearer token:

```
Authorization: Bearer <access_token>
```

Obtain a token via `POST /api/v1/auth/login` (credentials) or the OAuth2 flows. Access tokens expire in 15 minutes; use `POST /api/v1/auth/refresh` with a refresh token to rotate.

## Pagination

All list endpoints accept:

| Param | Default | Description |
|-------|---------|-------------|
| `page` | 0 | Zero-based page number |
| `size` | 20 | Items per page (max 100) |
| `sort` | `createdAt,desc` | Field + direction |

Response envelope:
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 342,
  "totalPages": 18,
  "last": false
}
```

## Error Format (RFC 7807)

```json
{
  "type": "https://codecrafter.dev/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Problem 'two-sum-hard' not found",
  "instance": "/api/v1/problems/two-sum-hard"
}
```

## Rate Limits

| Scope | Limit |
|-------|-------|
| Submissions (authenticated) | 5 / minute |
| Run (sample cases) | 30 / minute |
| API reads (authenticated) | 100 / minute |
| API reads (anonymous) | 20 / minute |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Endpoint Groups

### Auth (`/api/v1/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register with email + password |
| POST | `/login` | Login → access + refresh tokens |
| POST | `/refresh` | Rotate refresh token |
| POST | `/logout` | Revoke refresh token |
| POST | `/forgot-password` | Send reset email |
| POST | `/reset-password` | Apply new password |
| GET | `/verify-email` | Verify email via token param |

### Problems (`/api/v1/problems`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | Paginated problem list with filters |
| GET | `/{slug}` | — | Problem detail + starter code |
| POST | `/{slug}/run` | ✅ | Run against sample cases |
| POST | `/{slug}/submit` | ✅ | Submit to hidden test suite |
| GET | `/{slug}/submissions` | ✅ | User's submissions for problem |
| GET | `/{slug}/editorial` | — | Problem editorial |
| GET | `/{slug}/solutions` | — | Community solutions |
| POST | `/{slug}/solutions` | ✅ | Post a solution |
| GET | `/{slug}/discuss` | — | Discussion threads for problem |

**Query params for `/problems`:**
- `difficulty` — EASY / MEDIUM / HARD
- `status` — SOLVED / ATTEMPTED / TODO
- `tags` — comma-separated tag slugs
- `companies` — comma-separated company slugs
- `search` — title or number prefix
- `premium` — true/false

### Submissions (`/api/v1/submissions`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ✅ | User's submissions across all problems |
| GET | `/{id}` | ✅ | Single submission detail |

### Users (`/api/v1/u`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/{username}` | — | Public profile |
| GET | `/{username}/stats` | — | Stats, heatmap, streaks |
| GET | `/{username}/badges` | — | Badge collection |
| GET | `/{username}/rating-history` | — | Contest rating over time |
| GET | `/me` | ✅ | Current user profile |
| PUT | `/me` | ✅ | Update profile |
| PUT | `/me/avatar` | ✅ | Upload avatar (multipart) |

### Contests (`/api/v1/contests`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | All contests (paginated) |
| GET | `/{slug}` | — | Contest detail |
| POST | `/{slug}/register` | ✅ | Register for contest |
| GET | `/{slug}/problems` | — | Problem list (locked pre-start) |
| GET | `/{slug}/leaderboard` | — | Real-time leaderboard |
| GET | `/{slug}/my-submissions` | ✅ | User's contest submissions |

### Study Plans (`/api/v1/study-plans`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | All plans |
| GET | `/{slug}` | — | Plan detail + problems |
| POST | `/{slug}/start` | ✅ | Enroll user in plan |
| POST | `/{slug}/problems/{problemId}/complete` | ✅ | Mark problem done |

### Daily Challenge (`/api/v1/daily-challenge`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/today` | — | Today's challenge |
| GET | `/history` | — | Past challenges |

### Discuss (`/api/v1/discuss`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | All threads (paginated, filterable by category) |
| POST | `/` | ✅ | Create thread |
| GET | `/{id}` | — | Thread + replies |
| POST | `/{id}/replies` | ✅ | Add reply |
| POST | `/{id}/vote` | ✅ | Upvote/downvote |

### Admin (`/api/v1/admin`) — `ROLE_ADMIN` required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats` | Dashboard stats |
| GET/POST/PUT/DELETE | `/problems` | Problem CRUD |
| POST | `/problems/{slug}/rejudge` | Re-judge all submissions |
| POST/DELETE | `/problems/{slug}/test-cases` | Manage test cases |
| GET/POST/PUT | `/editorials/{problemSlug}` | Editorial CRUD |
| GET/POST/PUT | `/contests` | Contest management |
| POST | `/contests/{slug}/end` | Force-end contest |
| GET/POST/PUT | `/study-plans` | Study plan management |
| POST | `/daily-challenge` | Schedule daily challenge |
| GET | `/users` | User list with search |
| PATCH | `/users/{id}/ban` | Ban user |
| PATCH | `/users/{id}/unban` | Unban user |
| POST/DELETE | `/users/{id}/roles` | Manage user roles |

### WebSocket (STOMP over SockJS)

Connect endpoint: `/ws` (SockJS fallback enabled)

| Topic | Description |
|-------|-------------|
| `/topic/submissions/{userId}` | Live verdict updates for a user |
| `/topic/contest/{contestId}/leaderboard` | Contest leaderboard updates |

**Verdict message payload:**
```json
{
  "submissionId": 42,
  "verdict": "ACCEPTED",
  "testcasesPassed": 47,
  "totalTestcases": 47,
  "failingTestcaseIndex": null,
  "runtimeMs": 124,
  "memoryKb": 18432,
  "results": [...]
}
```
