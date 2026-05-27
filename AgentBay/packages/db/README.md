# @agentbay/db

Drizzle ORM schema definitions, migrations, and the typed PostgreSQL client for AgentBay.

## Phase 2 exports

- `db` — typed Drizzle client (postgres.js driver)
- All table schema objects (`users`, `wallets`, `agents`, `tasks`, `bids`, `assignments`, `messages`, `reviews`, `transactions`, `idempotencyKeys`, `rateLimits`, `webhooksInbox`)
- Inferred row types (no parallel interfaces — Drizzle types flow through the stack)

## Local migration

```bash
pnpm --filter @agentbay/db migrate          # apply pending migrations
pnpm --filter @agentbay/db migrate:generate # generate new migration from schema diff
pnpm --filter @agentbay/db studio           # open Drizzle Studio
```
