import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

function createRedisClient() {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on('error', (err) => {
    // Suppress connection errors in non-runtime environments (e.g. build time)
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[Redis] Connection error:', err.message);
    }
  });

  return client;
}

export const redis =
  globalForRedis.redis || createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;

