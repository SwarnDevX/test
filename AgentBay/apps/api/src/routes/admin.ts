import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { encodeFunctionData } from 'viem';
import { getDb, tasks, users, agents, transactions } from '@agentbay/db';
import { taskEscrowAbi } from '@agentbay/contracts';
import { env } from '../config/env.js';
import { requireAdmin } from '../middleware/auth.js';
import { invalidateStatsCache } from '../services/stats.service.js';

const admin = new Hono();

admin.use('*', requireAdmin);

const cursorSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

admin.get('/tasks', zValidator('query', cursorSchema), async (c) => {
  const { limit } = c.req.valid('query');
  const db = getDb();

  const rows = await db
    .select()
    .from(tasks)
    .where(isNull(tasks.deletedAt))
    .orderBy(desc(tasks.createdAt))
    .limit(limit);

  const serialized = rows.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    posterId: t.posterId,
    budgetUsdc: t.budgetUsdc.toString(),
    createdAt: t.createdAt.toISOString(),
  }));

  return c.json({ ok: true, data: { tasks: serialized } });
});

// ── Users ─────────────────────────────────────────────────────────────────────

admin.get('/users', zValidator('query', cursorSchema), async (c) => {
  const { limit } = c.req.valid('query');
  const db = getDb();

  const rows = await db
    .select({
      id: users.id,
      walletAddress: users.walletAddress,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  const serialized = rows.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return c.json({ ok: true, data: { users: serialized } });
});

// ── Agents ────────────────────────────────────────────────────────────────────

admin.get('/agents', zValidator('query', cursorSchema), async (c) => {
  const { limit } = c.req.valid('query');
  const db = getDb();

  const rows = await db
    .select({
      id: agents.id,
      name: agents.name,
      isActive: agents.isActive,
      ownerId: agents.ownerId,
      reputationScore: agents.reputationScore,
      createdAt: agents.createdAt,
    })
    .from(agents)
    .orderBy(desc(agents.createdAt))
    .limit(limit);

  const serialized = rows.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return c.json({ ok: true, data: { agents: serialized } });
});

// ── Disputes ──────────────────────────────────────────────────────────────────

admin.get('/disputes', async (c) => {
  const db = getDb();

  const rows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.status, 'disputed'), isNull(tasks.deletedAt)))
    .orderBy(desc(tasks.createdAt));

  const serialized = rows.map((t) => ({
    id: t.id,
    title: t.title,
    posterId: t.posterId,
    budgetUsdc: t.budgetUsdc.toString(),
    onchainTaskId: t.onchainTaskId,
    createdAt: t.createdAt.toISOString(),
  }));

  return c.json({ ok: true, data: { disputes: serialized } });
});

// ── Dispute resolution — returns calldata for admin to sign ───────────────────

const resolveSchema = z.object({
  releaseToAgent: z.boolean(),
});

admin.post(
  '/disputes/:taskId/resolve',
  zValidator('param', z.object({ taskId: z.string() })),
  zValidator('json', resolveSchema),
  async (c) => {
    const { taskId } = c.req.valid('param');
    const { releaseToAgent } = c.req.valid('json');
    const db = getDb();

    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.status, 'disputed'), isNull(tasks.deletedAt)))
      .limit(1);

    if (task == null) {
      return c.json(
        { ok: false, error: { code: 'NOT_FOUND', message: 'Disputed task not found' } },
        404,
      );
    }

    if (task.onchainTaskId == null) {
      return c.json(
        { ok: false, error: { code: 'NOT_ONCHAIN', message: 'Task has no onchain ID' } },
        422,
      );
    }

    const calldata = encodeFunctionData({
      abi: taskEscrowAbi,
      functionName: 'resolveDispute',
      args: [BigInt(task.onchainTaskId), releaseToAgent],
    });

    await invalidateStatsCache();

    return c.json({
      ok: true,
      data: {
        to: env.CONTRACT_TASK_ESCROW_ADDRESS,
        calldata,
        taskId: task.id,
        releaseToAgent,
      },
    });
  },
);

// ── Platform stats (admin view — bypass cache) ────────────────────────────────

admin.get('/stats/raw', async (c) => {
  const db = getDb();

  const [txRow] = await db
    .select({ total: transactions.amount })
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(1);

  const taskCounts = await db.execute<{ status: string; count: string }>(
    `SELECT status, COUNT(*) as count FROM tasks WHERE deleted_at IS NULL GROUP BY status`,
  );

  return c.json({ ok: true, data: { taskCounts, lastTxAmount: txRow?.total?.toString() ?? '0' } });
});

export default admin;
