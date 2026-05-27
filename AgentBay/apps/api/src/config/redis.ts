import Redis from 'ioredis';
import { env } from './env.js';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis != null) return _redis;

  _redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  _redis.on('error', (err: Error) => {
    process.stderr.write(`Redis error: ${err.message}\n`);
  });

  return _redis;
}

export async function closeRedis(): Promise<void> {
  if (_redis != null) {
    await _redis.quit();
    _redis = null;
  }
}
