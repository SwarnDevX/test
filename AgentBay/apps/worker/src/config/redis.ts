import Redis from 'ioredis';
import { env } from './env.js';

// Separate connections: BullMQ requires its own (blocking commands); pub/sub needs another.
let _bullmq: Redis | null = null;
let _pubsub: Redis | null = null;

const COMMON_OPTIONS = {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
} as const;

export function getBullmqRedis(): Redis {
  if (_bullmq != null) return _bullmq;
  _bullmq = new Redis(env.REDIS_URL, COMMON_OPTIONS);
  _bullmq.on('error', (err: Error) => {
    process.stderr.write(`[redis:bullmq] ${err.message}\n`);
  });
  return _bullmq;
}

export function getPubSubRedis(): Redis {
  if (_pubsub != null) return _pubsub;
  _pubsub = new Redis(env.REDIS_URL, { ...COMMON_OPTIONS, maxRetriesPerRequest: 3 });
  _pubsub.on('error', (err: Error) => {
    process.stderr.write(`[redis:pubsub] ${err.message}\n`);
  });
  return _pubsub;
}

export async function closeAllRedis(): Promise<void> {
  await Promise.all([
    _bullmq?.quit(),
    _pubsub?.quit(),
  ]);
  _bullmq = null;
  _pubsub = null;
}
