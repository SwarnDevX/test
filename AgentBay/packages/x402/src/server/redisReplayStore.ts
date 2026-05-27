// Redis-backed ReplayStore implementation.
// Import and use this in apps/api when constructing x402 middleware.
import { REPLAY_TTL_SECONDS } from '../constants.js';
import type { ReplayStore } from '../types.js';

// Minimal interface so packages/x402 doesn't need ioredis as a direct dep.
interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, flag: 'EX', ttl: number): Promise<unknown>;
}

export function createRedisReplayStore(redis: RedisLike): ReplayStore {
  return {
    async has(txHash: string): Promise<boolean> {
      const value = await redis.get(`x402:used:${txHash}`);
      return value != null;
    },
    async add(txHash: string): Promise<void> {
      await redis.set(`x402:used:${txHash}`, '1', 'EX', REPLAY_TTL_SECONDS);
    },
  };
}

// In-memory store for testing — never use in production.
export function createMemoryReplayStore(): ReplayStore {
  const used = new Set<string>();
  return {
    async has(txHash: string): Promise<boolean> {
      return used.has(txHash);
    },
    async add(txHash: string): Promise<void> {
      used.add(txHash);
    },
  };
}
