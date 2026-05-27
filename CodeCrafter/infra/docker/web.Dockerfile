# ── Dependency install ────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json* ./
RUN npm ci

# ── Builder ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ .
ENV NEXT_TELEMETRY_DISABLED=1
# Provide dummy env vars so build succeeds without real secrets
ENV NEXTAUTH_SECRET=build_placeholder
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=http://localhost:8080
RUN npm run build

# ── Production runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]

# ── Development (docker-compose.override.yml) ─────────────────────────────────
FROM node:20-alpine AS development
WORKDIR /app
COPY web/package.json web/package-lock.json* ./
RUN npm ci
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["npm", "run", "dev"]
