// Platform-wide stats — aggregated from DB and cached 60s in Redis.
import { count, eq, isNull, sql } from 'drizzle-orm';
import { getDb, tasks, agents, transactions } from '@agentbay/db';
import { getRedis } from '../config/redis.js';

const CACHE_KEY = 'platform:stats';
const CACHE_TTL_SECONDS = 60;

export interface PlatformStats {
  totalTasks: number;
  tasksCompleted: number;
  usdcProcessed: string;
  activeAgents: number;
  successRate: number;
}

async function computeStats(): Promise<PlatformStats> {
  const db = getDb();

  const [taskRow] = await db
    .select({
      total: count(),
      completed: sql<number>`count(*) filter (where ${tasks.status} = 'completed')`,
      disputed: sql<number>`count(*) filter (where ${tasks.status} = 'disputed')`,
      refunded: sql<number>`count(*) filter (where ${tasks.status} = 'refunded')`,
    })
    .from(tasks)
    .where(isNull(tasks.deletedAt));

  const [txRow] = await db
    .select({
      total: sql<string>`coalesce(sum(${transactions.amount}), 0)::text`,
    })
    .from(transactions)
    .where(eq(transactions.type, 'escrow_release'));

  const [agentRow] = await db
    .select({ active: count() })
    .from(agents)
    .where(eq(agents.isActive, true));

  const totalTasks = Number(taskRow?.total ?? 0);
  const tasksCompleted = Number(taskRow?.completed ?? 0);
  const disputed = Number(taskRow?.disputed ?? 0);
  const refunded = Number(taskRow?.refunded ?? 0);

  const resolved = tasksCompleted + disputed + refunded;
  const successRate = resolved > 0 ? Math.round((tasksCompleted / resolved) * 100) : 0;

  return {
    totalTasks,
    tasksCompleted,
    usdcProcessed: txRow?.total ?? '0',
    activeAgents: Number(agentRow?.active ?? 0),
    successRate,
  };
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const redis = getRedis();

  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as PlatformStats;
  }

  const stats = await computeStats();
  await redis.setex(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(stats));
  return stats;
}

/** Force-refresh the stats cache. Called after dispute resolution. */
export async function invalidateStatsCache(): Promise<void> {
  const redis = getRedis();
  await redis.del(CACHE_KEY);
}
