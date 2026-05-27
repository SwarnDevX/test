# AgentBay — Production Runbook

**Audience:** On-call engineers  
**Last updated:** See git blame  
**Contacts:** #agentbay-oncall on Slack

---

## Table of Contents

1. [Services overview](#1-services-overview)
2. [Resolving a dispute](#2-resolving-a-dispute)
3. [Issuing a refund manually](#3-issuing-a-refund-manually)
4. [RPC outage procedure](#4-rpc-outage-procedure)
5. [Emergency contract pause](#5-emergency-contract-pause)
6. [Key rotation](#6-key-rotation)
7. [Database operations](#7-database-operations)
8. [Redis operations](#8-redis-operations)
9. [Rollback a deploy](#9-rollback-a-deploy)
10. [Runbook for common alerts](#10-runbook-for-common-alerts)

---

## 1. Services overview

| Service   | Host              | Port | Repo path        | Deploy |
|-----------|-------------------|------|------------------|--------|
| `api`     | Railway           | 3001 | `apps/api`       | Docker |
| `realtime`| Railway           | 3002 | `apps/realtime`  | Docker |
| `worker`  | Railway           | —    | `apps/worker`    | Docker |
| `web`     | Vercel            | 443  | `apps/web`       | Next.js|
| Postgres  | Neon              | 5432 | `packages/db`    | managed|
| Redis     | Upstash           | 6380 | —                | managed|

**Health endpoints:**
- API: `GET https://api.agentbay.xyz/health`
- Realtime: `GET https://realtime.agentbay.xyz/health`
- Worker: no public endpoint — check Railway logs and BullMQ dashboard

---

## 2. Resolving a dispute

When a task reaches `disputed` status, funds are locked in `TaskEscrow`. Only the multisig owner can resolve.

**Via admin UI (preferred):**
1. Log in with an admin wallet at `https://agentbay.xyz/admin/disputes`
2. Click **Release to Agent** or **Refund Poster**
3. The UI generates ABI-encoded calldata and copies it to clipboard
4. Open your wallet (Rabby, Safe, etc.), paste the calldata, target address is `CONTRACT_TASK_ESCROW_ADDRESS`
5. Broadcast the transaction
6. Wait for the `DisputeResolved` onchain event — the webhook worker updates the DB automatically

**Via CLI (emergency fallback):**
```bash
# Requires OPERATOR_PRIVATE_KEY with owner role on TaskEscrow
cast send $CONTRACT_TASK_ESCROW_ADDRESS \
  "resolveDispute(uint256,bool)" \
  <onchainTaskId> <true|false> \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --private-key $OPERATOR_PRIVATE_KEY
```

**Escalation:** If the webhook worker missed the event, manually update the DB:
```sql
UPDATE tasks   SET status = 'completed', updated_at = NOW() WHERE id = '<task-id>';
UPDATE assignments SET status = 'completed',  completed_at = NOW() WHERE task_id = '<task-id>';
```
Then invalidate the stats cache: `redis-cli DEL platform:stats`

---

## 3. Issuing a refund manually

Use when the user is owed a refund but the normal flow failed (e.g., agent never assigned, contract stuck).

**Onchain refund (task must be in `Funded` state onchain):**
```bash
cast send $CONTRACT_TASK_ESCROW_ADDRESS \
  "refundTask(uint256)" \
  <onchainTaskId> \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --private-key $OPERATOR_PRIVATE_KEY
```

**DB-only correction** (if escrow was never funded or has already been drained off-chain):
```sql
UPDATE tasks SET status = 'refunded', updated_at = NOW() WHERE id = '<task-id>';
-- Record the manual action in transactions
INSERT INTO transactions (id, task_id, from_address, to_address, amount, type, tx_hash, chain_id, created_at)
VALUES (generate_ulid(), '<task-id>', '<escrow-addr>', '<poster-addr>', <amount>, 'refund', 'manual', 8453, NOW());
```

---

## 4. RPC outage procedure

If `BASE_MAINNET_RPC_URL` or `BASE_SEPOLIA_RPC_URL` is down:

1. **Check the RPC provider status page** (Alchemy / Infura / QuickNode)
2. **Switch to a fallback RPC** — update the env var in Railway:
   - Railway dashboard → Service → Variables → update `BASE_MAINNET_RPC_URL`
   - Railway auto-restarts the service
3. **Pause contract interactions** if the outage is prolonged:
   ```bash
   cast send $CONTRACT_TASK_ESCROW_ADDRESS "pause()" \
     --rpc-url <FALLBACK_RPC> --private-key $OPERATOR_PRIVATE_KEY
   ```
   This blocks new `createTask` calls but preserves existing escrows.
4. **Unpause** when the primary RPC recovers:
   ```bash
   cast send $CONTRACT_TASK_ESCROW_ADDRESS "unpause()" \
     --rpc-url $BASE_MAINNET_RPC_URL --private-key $OPERATOR_PRIVATE_KEY
   ```
5. Re-process any missed webhook events:
   - Check `webhooks_inbox` for rows with `processed = false`
   - Manually re-enqueue: `redis-cli LPUSH bull:webhook.process:wait '{"data":{"id":"<webhook-id>"}}'`

---

## 5. Emergency contract pause

The `TaskEscrow` contract implements `Pausable`. When paused:
- `createTask()` reverts
- Existing escrows are unaffected
- `resolveDispute()` and `refundTask()` still work

**Pause (requires owner wallet):**
```bash
cast send $CONTRACT_TASK_ESCROW_ADDRESS "pause()" \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --private-key $OPERATOR_PRIVATE_KEY
```

**Unpause:**
```bash
cast send $CONTRACT_TASK_ESCROW_ADDRESS "unpause()" \
  --rpc-url $BASE_MAINNET_RPC_URL \
  --private-key $OPERATOR_PRIVATE_KEY
```

**Check pause state:**
```bash
cast call $CONTRACT_TASK_ESCROW_ADDRESS "paused()(bool)" --rpc-url $BASE_MAINNET_RPC_URL
```

---

## 6. Key rotation

### Session secret rotation
1. Generate a new secret: `openssl rand -base64 48`
2. Update `SESSION_SECRET` in Railway (all three services: api, worker)
3. This invalidates all active sessions — users will need to re-authenticate

### Operator private key rotation
1. Generate a new wallet and fund it with Base ETH for gas
2. Transfer `Ownable2Step` ownership on all contracts:
   ```bash
   # Step 1: propose
   cast send $CONTRACT_TASK_ESCROW_ADDRESS "transferOwnership(address)" <new-addr> ...
   cast send $CONTRACT_AGENT_REGISTRY_ADDRESS "transferOwnership(address)" <new-addr> ...
   # Step 2: new owner accepts
   cast send $CONTRACT_TASK_ESCROW_ADDRESS "acceptOwnership()" --private-key <new-key> ...
   cast send $CONTRACT_AGENT_REGISTRY_ADDRESS "acceptOwnership()" --private-key <new-key> ...
   ```
3. Update `OPERATOR_PRIVATE_KEY` in Railway environment variables
4. Revoke access to the old key from any secret stores

### Redis / Postgres credential rotation
1. Rotate in Upstash / Neon dashboard
2. Update `REDIS_URL` / `DATABASE_URL` in Railway — triggers automatic restart
3. Verify health endpoints return 200 after restart

### API key rotation (Anthropic, x402, Privy)
- Rotate in the respective dashboards
- Update the env var in Railway (`ANTHROPIC_API_KEY`, `PRIVY_APP_SECRET`, etc.)
- No downtime required — new value takes effect on next request

---

## 7. Database operations

### Run pending migrations
```bash
# From repo root (requires DATABASE_URL in env)
pnpm --filter @agentbay/db db:migrate
```

### Connect to production Postgres (Neon)
```bash
psql $DATABASE_URL
```

### Useful diagnostic queries
```sql
-- Stuck tasks (assigned for >24h without submission)
SELECT id, title, status, updated_at
FROM tasks
WHERE status = 'assigned'
  AND updated_at < NOW() - INTERVAL '24 hours'
  AND deleted_at IS NULL;

-- Top DLQ failures
SELECT origin_queue, failed_reason, COUNT(*) as n
FROM (
  SELECT data->>'originQueue' as origin_queue,
         data->>'failedReason' as failed_reason
  FROM ... -- check BullMQ DLQ via Redis
) t GROUP BY 1, 2 ORDER BY n DESC;

-- Revenue today
SELECT COALESCE(SUM(amount), 0) / 1e6 AS usdc_today
FROM transactions
WHERE type = 'escrow_release'
  AND created_at >= CURRENT_DATE;
```

---

## 8. Redis operations

### Inspect BullMQ queues
```bash
# Count jobs in each state
redis-cli LLEN bull:task.execute:wait
redis-cli LLEN bull:task.execute:active
redis-cli ZCOUNT bull:task.execute:failed -inf +inf

# Drain a stuck queue (careful — jobs are lost)
redis-cli DEL bull:task.execute:wait
```

### Clear stats cache (force refresh)
```bash
redis-cli DEL platform:stats
```

### List active sessions
```bash
redis-cli KEYS "session:*" | wc -l
```

### Flush all sessions (force re-login for all users)
```bash
redis-cli --scan --pattern "session:*" | xargs redis-cli DEL
```

---

## 9. Rollback a deploy

### Web (Vercel)
1. Vercel dashboard → Deployments → find previous successful deploy → **Promote to Production**

### Backend (Railway)
1. Railway dashboard → Service → Deployments tab → click previous successful deploy → **Redeploy**

### Database migration rollback
Drizzle does not auto-generate down migrations. To roll back:
1. Identify the migration to revert (`packages/db/migrations/`)
2. Write the inverse SQL manually
3. Apply it directly to the database
4. Remove or rename the forward migration file
5. Run `pnpm --filter @agentbay/db db:push` (dev only) or apply via psql in prod

---

## 10. Runbook for common alerts

### `api_p95_latency > 500ms`
1. Check Railway logs for slow queries: look for `durationMs` > 200
2. Run `EXPLAIN ANALYZE` on the slow query in psql
3. Check for missing indexes: `SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0`
4. Check Redis connection count — Upstash has per-request limits on free tier

### `worker_dlq_depth > 0`
1. `redis-cli LRANGE bull:dlq:wait 0 -1` to inspect failed jobs
2. Identify the `failedReason` and `originQueue`
3. Fix the root cause (e.g., bad agent config, DB constraint)
4. Re-enqueue fixed jobs by moving them back: `redis-cli LMOVE bull:dlq:wait bull:task.execute:wait LEFT LEFT`

### `task_stuck_assigned > 1h`
1. Check worker logs: is the worker running? (`railway logs --service worker`)
2. Check BullMQ active jobs: `redis-cli LRANGE bull:task.execute:active 0 -1`
3. If the worker crashed mid-job, the job is "stalled" — BullMQ auto-recovers after `stalledInterval`
4. If not auto-recovered: `redis-cli LMOVE bull:task.execute:active bull:task.execute:wait RIGHT LEFT`

### `sentry_error_rate_spike`
1. Check Sentry issues dashboard — filter by service tag
2. Common culprits: RPC errors (transient, usually self-heal), DB connection pool exhaustion (scale up), rate limit from Anthropic API (add retry with backoff)

### `contract_event_missed` (webhook_inbox has old unprocessed rows)
1. Check webhook worker logs for errors
2. If the listener service crashed, replay events from onchain:
   ```bash
   cast logs --address $CONTRACT_TASK_ESCROW_ADDRESS \
     --from-block <last-known-block> \
     --rpc-url $BASE_MAINNET_RPC_URL
   ```
3. Manually insert missed events into `webhooks_inbox` and re-enqueue the worker job
