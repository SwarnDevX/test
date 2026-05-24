import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

interface RateLimitOptions {
  windowMs: number;  // time window in ms
  max: number;       // max requests per window
  identifier?: string;
}

export async function rateLimit(
  userId: string,
  action: string,
  options: RateLimitOptions
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const { windowMs, max } = options;
  const key = `ratelimit:${action}:${userId}`;
  const windowSec = Math.ceil(windowMs / 1000);

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSec);
    }
    const ttl = await redis.ttl(key);
    const resetAt = Date.now() + ttl * 1000;
    const remaining = Math.max(0, max - current);

    if (current > max) {
      return { success: false, remaining: 0, resetAt };
    }
    return { success: true, remaining, resetAt };
  } catch {
    // If Redis is unavailable, allow the request
    return { success: true, remaining: max, resetAt: Date.now() + windowMs };
  }
}

export function rateLimitResponse(resetAt: number) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((resetAt - Date.now()) / 1000).toString(),
        'X-RateLimit-Reset': resetAt.toString(),
      },
    }
  );
}

// Preset limiters
export const AI_RATE_LIMIT = { windowMs: 60_000, max: 10 };       // 10 AI calls/min
export const AUTH_RATE_LIMIT = { windowMs: 900_000, max: 10 };     // 10 auth attempts/15min
export const UPLOAD_RATE_LIMIT = { windowMs: 60_000, max: 20 };    // 20 uploads/min
export const EXPORT_RATE_LIMIT = { windowMs: 60_000, max: 5 };     // 5 exports/min

