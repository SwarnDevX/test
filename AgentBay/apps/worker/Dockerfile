# syntax=docker/dockerfile:1.7
# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:22-slim AS deps
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json        packages/shared/package.json
COPY packages/db/package.json            packages/db/package.json
COPY packages/observability/package.json packages/observability/package.json
COPY packages/contracts/package.json     packages/contracts/package.json
COPY packages/agents/package.json        packages/agents/package.json
COPY apps/worker/package.json            apps/worker/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/ packages/
COPY apps/worker/ apps/worker/

RUN pnpm turbo build --filter=@agentbay/worker...

RUN pnpm --filter @agentbay/worker deploy --prod /deploy

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:22-slim AS runtime

RUN addgroup --system --gid 1001 agentbay && \
    adduser  --system --uid 1001 --ingroup agentbay agentbay

WORKDIR /app
COPY --from=builder --chown=agentbay:agentbay /deploy ./

USER agentbay

ENV NODE_ENV=production

# Workers have no public HTTP port — health is checked via BullMQ queue depth
HEALTHCHECK --interval=60s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "import('@agentbay/shared').then(()=>process.exit(0)).catch(()=>process.exit(1))" || exit 1

CMD ["node", "dist/index.js"]
