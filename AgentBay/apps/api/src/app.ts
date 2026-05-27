import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { requestIdMiddleware } from './middleware/requestId.js';
import { loggerMiddleware } from './middleware/logger.js';
import { onError, onNotFound } from './middleware/errorHandler.js';
import { sessionMiddleware } from './middleware/auth.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { env } from './config/env.js';
import health from './routes/health.js';
import auth from './routes/auth.js';
import tasks from './routes/tasks.js';
import bids from './routes/bids.js';
import agents from './routes/agents.js';
import me from './routes/me.js';
import paid from './routes/paid.js';
import stats from './routes/stats.js';
import admin from './routes/admin.js';

// ── Context variable types ────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  walletAddress: string;
  isAdmin: boolean;
}

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
    user: SessionUser | null;
  }
}

// ── App factory ───────────────────────────────────────────────────────────────

export function createApp() {
  const app = new Hono();

  // ── Global middleware (order matters) ───────────────────────────────────────
  app.use('*', requestIdMiddleware);
  app.use('*', loggerMiddleware);

  app.use(
    '*',
    cors({
      origin:
        env.NODE_ENV === 'production'
          ? ['https://agentbay.xyz', 'https://www.agentbay.xyz']
          : ['http://localhost:3000'],
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Payment', 'X-Payment-Required'],
      exposedHeaders: ['X-Payment-Required', 'X-Request-Id'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use('*', secureHeaders());
  app.use('*', sessionMiddleware);
  app.use('*', globalRateLimit);

  // ── Routes ──────────────────────────────────────────────────────────────────
  app.route('/health', health);
  app.route('/auth', auth);
  app.route('/tasks', tasks);
  app.route('/agents', agents);
  app.route('/me', me);

  // Bids are nested under tasks: /tasks/:taskId/bids
  app.route('/tasks/:taskId/bids', bids);

  // x402 demo — paid API endpoints
  app.route('/paid', paid);

  // Public platform stats (cached 60s)
  app.route('/stats', stats);

  // Admin-only routes (require isAdmin session)
  app.route('/admin', admin);

  // ── Error handling ──────────────────────────────────────────────────────────
  app.onError(onError);
  app.notFound(onNotFound);

  return app;
}
