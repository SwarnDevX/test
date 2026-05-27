import { Hono } from 'hono';
import { getDb } from '@agentbay/db';
import { sql } from 'drizzle-orm';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const health = new Hono();

health.get('/', async (c) => {
  const checks = await Promise.allSettled([
    checkDb(),
    checkRedis(),
    checkRpc(),
  ]);

  const [db, redis, rpc] = checks.map((r) =>
    r.status === 'fulfilled'
      ? { ok: true as const }
      : { ok: false as const, error: String(r.reason) },
  );

  const allOk = checks.every((r) => r.status === 'fulfilled');

  return c.json(
    {
      ok: allOk,
      service: 'api',
      version: process.env['npm_package_version'] ?? '0.0.0',
      checks: { db, redis, rpc },
    },
    allOk ? 200 : 503,
  );
});

async function checkDb(): Promise<void> {
  const db = getDb();
  await db.execute(sql`SELECT 1`);
}

async function checkRedis(): Promise<void> {
  const redis = getRedis();
  await redis.ping();
}

async function checkRpc(): Promise<void> {
  const client = createPublicClient({
    chain: baseSepolia,
    transport: http(env.BASE_SEPOLIA_RPC_URL),
  });
  await client.getBlockNumber();
}

export default health;
