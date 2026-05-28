# Ops Runbook

Operational procedures for CodeCrafter. For architecture context see [architecture.md](architecture.md). For sandbox security see [security.md](security.md).

---

## Table of Contents

1. [Starting / stopping services](#1-starting--stopping-services)
2. [Adding a new language](#2-adding-a-new-language)
3. [Re-judging all submissions for a problem](#3-re-judging-all-submissions-for-a-problem)
4. [Handling a stuck RabbitMQ queue](#4-handling-a-stuck-rabbitmq-queue)
5. [Rolling back a bad deploy](#5-rolling-back-a-bad-deploy)
6. [Rotating secrets](#6-rotating-secrets)
7. [Scaling judge workers](#7-scaling-judge-workers)
8. [Database migrations](#8-database-migrations)
9. [Backup and restore](#9-backup-and-restore)
10. [Debugging a wrong verdict](#10-debugging-a-wrong-verdict)
11. [Emergency procedures](#11-emergency-procedures)

---

## 1. Starting / Stopping Services

**Local dev:**
```bash
docker compose up            # start all services
docker compose up api web    # start only specific services
docker compose down          # stop and remove containers
docker compose down -v       # stop and delete all data volumes (destructive!)
```

**Kubernetes (production):**
```bash
# Scale a deployment to zero (soft stop)
kubectl -n codecrafter scale deployment/api --replicas=0

# Restart a deployment with zero downtime
kubectl -n codecrafter rollout restart deployment/api

# Check rollout status
kubectl -n codecrafter rollout status deployment/judge-worker

# View logs (last 100 lines, follow)
kubectl -n codecrafter logs -l app=api --tail=100 -f
```

---

## 2. Adding a New Language

**Step 1 — Add the language enum value** in both modules:
- `backend/src/main/java/dev/codecrafter/problem/sandbox/Language.java`
- `judge-worker/src/main/java/dev/codecrafter/judge/sandbox/Language.java`

Each enum entry needs: `key`, `dockerImage`, `sourceFileName`, `compileCommand` (null if interpreted), `runCommand`, `isCompiled`.

**Step 2 — Pull the Docker image on judge worker nodes:**
```bash
# On every node that runs judge-worker pods:
docker pull python:3.12-slim   # example for Python
```

Or add it to the judge-worker Dockerfile as a pre-pull stage:
```dockerfile
FROM python:3.12-slim AS python-lang
```
This embeds the image in the judge-worker image build cache.

**Step 3 — Add starter code stubs** via the admin panel:
- Go to `/admin/problems`
- For each problem, open Edit → add a starter code entry for the new language

**Step 4 — Update the frontend language selector** in [web/src/components/editor/CodeEditor.tsx](../web/src/components/editor/CodeEditor.tsx) — add the language to the options list and map it to Monaco's language ID.

**Step 5 — Add to the `.env.example`** if the image requires special config.

**Step 6 — Test** by submitting "Hello World" and verifying ACCEPTED.

---

## 3. Re-judging All Submissions for a Problem

Use this when test cases are updated (added, corrected, or removed).

**Via admin panel UI:**
1. Go to `/admin/problems/{slug}`
2. Click **Re-judge** — this enqueues all submissions into RabbitMQ

**Via API (curl):**
```bash
TOKEN="your-admin-jwt"
curl -X POST https://api.codecrafter.dev/api/v1/admin/problems/{slug}/rejudge \
  -H "Authorization: Bearer $TOKEN"
```

**What happens:**
1. All submissions for the problem are set to `QUEUED` status
2. Each is published to RabbitMQ `submissions.queue`
3. Judge workers pick them up; results flow back via `verdicts.queue`
4. Users see updated verdicts on their submission history

**Monitoring progress:**
```bash
# RabbitMQ queue depth
kubectl -n codecrafter exec deployment/rabbitmq -- rabbitmqctl list_queues
```

Large problems (1000+ submissions) may take 10–30 minutes. Watch judge worker CPU in Grafana.

---

## 4. Handling a Stuck RabbitMQ Queue

**Symptoms:** Queue depth growing, no verdicts arriving, judge workers not consuming.

**Check 1 — Is the worker alive?**
```bash
kubectl -n codecrafter get pods -l app=judge-worker
kubectl -n codecrafter logs -l app=judge-worker --tail=50
```

**Check 2 — Is Docker accessible inside judge worker?**
```bash
kubectl -n codecrafter exec deployment/judge-worker -- docker ps
```
If this fails, the Docker socket mount is broken. Check that the node's `/var/run/docker.sock` exists.

**Check 3 — Is there a poison message?**
A message that always crashes the worker will block the queue. Check for repeated errors in logs:
```bash
kubectl -n codecrafter logs -l app=judge-worker --tail=200 | grep "Fatal error"
```

If a poison message is stuck, purge the queue (all unprocessed submissions will need re-judging):
```bash
kubectl -n codecrafter exec deployment/rabbitmq -- \
  rabbitmqctl purge_queue submissions.queue
```

Then re-judge the affected problem via the admin panel.

**Check 4 — RabbitMQ connection refused?**
```bash
kubectl -n codecrafter exec deployment/api -- \
  curl -s http://rabbitmq:15672/api/overview -u guest:guest
```

If RabbitMQ is down, restart it:
```bash
kubectl -n codecrafter rollout restart statefulset/rabbitmq
```

---

## 5. Rolling Back a Bad Deploy

**Kubernetes rollback (recommended):**
```bash
# Rollback to previous revision
kubectl -n codecrafter rollout undo deployment/api

# Rollback to a specific revision
kubectl -n codecrafter rollout history deployment/api
kubectl -n codecrafter rollout undo deployment/api --to-revision=3
```

**Manual image pin:**
```bash
SHA="sha-abc1234"
kubectl -n codecrafter set image deployment/api \
  api=ghcr.io/swarndevx/codecrafter-api:${SHA}
kubectl -n codecrafter set image deployment/web \
  web=ghcr.io/swarndevx/codecrafter-web:${SHA}
kubectl -n codecrafter set image deployment/judge-worker \
  judge-worker=ghcr.io/swarndevx/codecrafter-judge-worker:${SHA}
```

**Database rollback:** Flyway does not support automatic downgrade. If a migration must be reverted:
1. Write a new migration `V{N+1}__revert_V{N}.sql` that undoes the schema change
2. Never delete or modify existing migration files (Flyway checksum validation will fail)

---

## 6. Rotating Secrets

**Step 1 — Generate new secret:**
```bash
openssl rand -base64 64 | tr -d '\n'   # JWT_SECRET
openssl rand -base64 32                 # NEXTAUTH_SECRET
```

**Step 2 — Update Kubernetes secret:**
```bash
kubectl -n codecrafter create secret generic codecrafter-secrets \
  --from-literal=JWT_SECRET="<new_value>" \
  --dry-run=client -o yaml | kubectl apply -f -
```

**Step 3 — Rolling restart** (pods reload env vars):
```bash
kubectl -n codecrafter rollout restart deployment/api deployment/web
```

**Impact of JWT_SECRET rotation:** All existing access tokens are immediately invalid. Refresh tokens are also invalidated (they're signed with the same secret). Users will be logged out and need to log in again. Schedule during off-peak hours.

**OAuth2 credentials rotation:** Update `GOOGLE_CLIENT_SECRET` / `GITHUB_CLIENT_SECRET` in the secret and restart the API pod. Existing sessions are unaffected (credentials are only used at login time).

---

## 7. Scaling Judge Workers

**Manual scale:**
```bash
kubectl -n codecrafter scale deployment/judge-worker --replicas=10
```

**HPA is already configured** (min 2, max 20, CPU target 60%). It scales automatically based on CPU load, which correlates with submission volume.

**For contest bursts (anticipated high load):**
```bash
# Pre-scale before a contest starts
kubectl -n codecrafter scale deployment/judge-worker --replicas=15
```

**KEDA (optional, queue-depth-based scaling):** If KEDA is installed in the cluster, apply a `ScaledObject` that reads RabbitMQ queue depth directly instead of using CPU as a proxy metric. This gives more responsive scaling. See the commented KEDA section in `infra/k8s/judge-worker.yaml`.

---

## 8. Database Migrations

Flyway runs automatically on API startup. All migrations are in `backend/src/main/resources/db/migration/`.

**Check migration status:**
```bash
kubectl -n codecrafter exec deployment/api -- \
  java -jar app.jar --spring.flyway.validate-on-migrate=true 2>&1 | grep -i flyway
```

**Manual migration (emergency):**
```bash
# Connect to Postgres
kubectl -n codecrafter exec -it statefulset/postgres -- \
  psql -U codecrafter codecrafter_db
```

**Adding a new migration:**
1. Create `V{N}__describe_change.sql` in `db/migration/`
2. Never modify existing migration files — Flyway validates checksums
3. Test locally with `docker compose up` before pushing
4. Migrations run on the next API deploy

---

## 9. Backup and Restore

**PostgreSQL backup:**
```bash
kubectl -n codecrafter exec statefulset/postgres -- \
  pg_dump -U codecrafter codecrafter_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

**PostgreSQL restore:**
```bash
kubectl -n codecrafter exec -i statefulset/postgres -- \
  psql -U codecrafter codecrafter_db < backup_20260101.sql
```

**Redis backup:** Redis data is ephemeral cache (rate limits, leaderboard sorted sets). No backup needed — data regenerates automatically from Postgres.

**MinIO backup:** Use `mc mirror` from the MinIO client:
```bash
mc alias set prod https://minio.codecrafter.dev ACCESS SECRET
mc mirror prod/codecrafter-assets ./backup/assets/
```

**Automated backups:** Consider pg_backup CronJob or Velero for cluster-level backup. Not included in current manifests.

---

## 10. Debugging a Wrong Verdict

**Step 1 — Find the submission:**
```bash
TOKEN="admin-jwt"
curl https://api.codecrafter.dev/api/v1/submissions/{id} \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Step 2 — Check what test case failed:**
The response includes `failingTestcaseIndex`, `stdout`, `stderr`, and `results[]`.

**Step 3 — Reproduce locally:**
```bash
# Pull the same Docker image the judge uses
docker run --rm -i python:3.12-slim python3 - <<EOF
# paste user's source code here
EOF
```

**Step 4 — Check test case data:**
Via admin panel: `/admin/problems/{slug}` → Test Cases tab. Verify `input` and `expectedOutput` have no trailing whitespace issues (comparison uses `.strip()`).

**Step 5 — Re-judge single submission (not yet implemented as a button; use rejudge-problem):**
Currently the only option is to re-judge all submissions for the problem.

---

## 11. Emergency Procedures

### API is down / returning 502
1. Check pod status: `kubectl -n codecrafter get pods -l app=api`
2. Check logs: `kubectl -n codecrafter logs -l app=api --tail=100`
3. Check DB connectivity: look for `HikariPool` timeout in logs
4. Restart: `kubectl -n codecrafter rollout restart deployment/api`

### Database is full / disk pressure
1. Check PVC usage: `kubectl -n codecrafter describe pvc postgres-pvc`
2. Expand PVC (if StorageClass supports it): `kubectl patch pvc postgres-pvc -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'`
3. Emergency: archive old `submissions.source_code` to MinIO and null the column

### Judge workers OOM-killed (sandbox memory leaks)
The sandbox has `--memory=256m` so sandboxes can't escape. If judge-worker pods themselves OOM:
1. Increase `resources.limits.memory` in `infra/k8s/judge-worker.yaml`
2. Reduce `concurrency` in `judge-worker/application.yml` from `2-4` to `1-2`

### Mass wrong verdict after test case change
1. **Do not panic** — users' submission records are in DB and re-judgeable
2. Fix the test case in admin panel
3. Run re-judge for the affected problem
4. Post announcement in the problem's discuss thread
