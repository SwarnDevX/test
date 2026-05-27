import { createMiddleware } from 'hono/factory';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { RateLimitError, hashPii } from '@agentbay/shared';
import type { SessionUser } from './auth.js';

interface RateLimitOptions {
  /** Sliding window duration in seconds */
  windowSeconds?: number;
  /** Max requests per window */
  maxRequests?: number;
}

// Sliding window rate limiter using Redis sorted sets.
// Key: `rl:{subject}:{route}` — subject is userId (authed) or hashed IP (anon).
// Algorithm: ZREMRANGEBYSCORE + ZADD + ZCARD + EXPIRE in a pipeline.
export function rateLimit(opts: RateLimitOptions = {}) {
  return createMiddleware(async (c, next) => {
    const redis = getRedis();
    const user = c.get('user') as SessionUser | null;

    const windowSeconds = opts.windowSeconds ?? 60;
    const maxRequests =
      opts.maxRequests ??
      (user != null ? env.RATE_LIMIT_AUTH_RPM : env.RATE_LIMIT_ANON_RPM);

    // Use userId for authenticated users, hashed IP for anonymous
    const ip =
      c.req.header('x-forwarded-for') ??
      c.req.header('x-real-ip') ??
      'unknown';
    const subject = user != null ? `u:${user.id}` : `ip:${hashPii(ip)}`;
    const route = `${c.req.method}:${c.req.routePath}`;
    const key = `rl:${subject}:${route}`;

    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, '-inf', windowStart);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.zcard(key);
    pipeline.expire(key, windowSeconds);
    const results = await pipeline.exec();

    const count = (results?.[2]?.[1] as number | undefined) ?? 0;

    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - count)));
    c.header('X-RateLimit-Reset', String(Math.ceil((now + windowSeconds * 1000) / 1000)));

    if (count > maxRequests) {
      throw new RateLimitError('Rate limit exceeded', windowSeconds * 1000);
    }

    await next();
  });
}

// Convenience: default global rate limiter (applied to all routes)
export const globalRateLimit = rateLimit();
