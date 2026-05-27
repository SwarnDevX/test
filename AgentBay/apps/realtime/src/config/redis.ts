import { Redis } from 'ioredis';
import { env } from './env.js';

// BullMQ / adapter Redis (blocking commands must run here)
let _main: Redis | null = null;
// Subscriber Redis for psubscribe (a subscribed connection can only run sub commands)
let _sub: Redis | null = null;

const COMMON_OPTIONS = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
} as const;

export function getMainRedis(): Redis {
  if (_main != null) return _main;
  _main = new Redis(env.REDIS_URL, COMMON_OPTIONS);
  _main.on('error', (err: Error) =>
    process.stderr.write(`[redis:main] ${err.message}\n`),
  );
  return _main;
}

export function getSubRedis(): Redis {
  if (_sub != null) return _sub;
  _sub = new Redis(env.REDIS_URL, COMMON_OPTIONS);
  _sub.on('error', (err: Error) =>
    process.stderr.write(`[redis:sub] ${err.message}\n`),
  );
  return _sub;
}

export async function closeAllRedis(): Promise<void> {
  await Promise.all([_main?.quit(), _sub?.quit()]);
  _main = null;
  _sub = null;
}
