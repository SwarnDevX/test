# syntax=docker/dockerfile:1.7
# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:22-slim AS deps
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json        packages/shared/package.json
COPY packages/observability/package.json packages/observability/package.json
COPY apps/realtime/package.json          apps/realtime/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/shared/     packages/shared/
COPY packages/observability/ packages/observability/
COPY apps/realtime/       apps/realtime/

RUN pnpm turbo build --filter=@agentbay/realtime...

RUN pnpm --filter @agentbay/realtime deploy --prod /deploy

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:22-slim AS runtime

RUN addgroup --system --gid 1001 agentbay && \
    adduser  --system --uid 1001 --ingroup agentbay agentbay

WORKDIR /app
COPY --from=builder --chown=agentbay:agentbay /deploy ./

USER agentbay
EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3002/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
