import redis from '../config/redis';
import crypto from 'crypto';

const DEFAULT_TTL = 60 * 60 * 24; // 24 hours

export function buildCacheKey(namespace: string, ...parts: string[]): string {
  const raw = parts.join(':');
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  return `growth:${namespace}:${hash}`;
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttl = DEFAULT_TTL): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    console.error('Cache set error:', err);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}

