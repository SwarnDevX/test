// Observability must be initialised before any other imports that touch the network/DB
import { initSentry, initTracing } from '@agentbay/observability';
initSentry({ service: 'api', dsn: process.env['SENTRY_DSN'] });
initTracing('agentbay-api');

import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './middleware/logger.js';
import { closeDb } from '@agentbay/db';
import { closeRedis } from './config/redis.js';

const app = createApp();

const server = serve({ fetch: app.fetch, port: env.PORT }, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'API server started');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down...');
  server.close(async () => {
    await Promise.all([closeDb(), closeRedis()]);
    process.exit(0);
  });

  // Force-exit if graceful shutdown stalls
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
