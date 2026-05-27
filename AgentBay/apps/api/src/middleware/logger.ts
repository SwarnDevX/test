import { createMiddleware } from 'hono/factory';
import pino from 'pino';
import { hashPii } from '@agentbay/shared';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    // Never log raw IPs or authorization headers
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    remove: true,
  },
  ...(env.NODE_ENV !== 'production'
    ? { transport: { target: 'pino/file', options: { destination: 1 } } }
    : {}),
});

export const loggerMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now();
  const requestId = c.get('requestId') as string | undefined ?? 'unknown';
  const ip = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown';

  await next();

  const durationMs = Date.now() - start;
  const userId = (c.get('user') as { id: string } | null)?.id;

  logger.info({
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs,
    userId,
    // Hash IP before logging — it's PII
    ipHash: ip !== 'unknown' ? hashPii(ip) : 'unknown',
  });
});
