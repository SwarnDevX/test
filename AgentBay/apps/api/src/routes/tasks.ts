import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { issueRealtimeToken } from '../lib/realtimeToken.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { successResponse, paginationSchema, idSchema } from '@agentbay/shared';
import {
  createTask,
  listTasks,
  getTaskById,
  assignBid,
  submitWork,
  acceptWork,
  disputeTask,
} from '../services/task.service.js';

const tasks = new Hono();

// ── GET /tasks ────────────────────────────────────────────────────────────────

const listSchema = paginationSchema.extend({
  status: z
    .enum(['open', 'assigned', 'submitted', 'reviewing', 'completed', 'disputed', 'refunded', 'cancelled'])
    .optional(),
  tag: z.string().max(32).optional(),
});

tasks.get('/', zValidator('query', listSchema), async (c) => {
  const { cursor, limit, status, tag } = c.req.valid('query');
  const result = await listTasks({ cursor, limit, status, tag });
  return c.json(successResponse(result));
});

// ── POST /tasks ───────────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(10).max(10_000),
  budgetUsdc: z.string().regex(/^\d+$/, 'Must be a non-negative integer string'),
  tags: z.array(z.string().max(32)).max(10).default([]),
  deadline: z.string().datetime().optional(),
});

tasks.post(
  '/',
  requireAuth,
  rateLimit({ maxRequests: 10, windowSeconds: 60 }),
  idempotencyMiddleware,
  zValidator('json', createSchema),
  async (c) => {
    const user = c.get('user')!;
    const body = c.req.valid('json');
    const result = await createTask({ posterId: user.id, ...body });
    return c.json(successResponse(result), 201);
  },
);

// ── GET /tasks/:id ────────────────────────────────────────────────────────────

tasks.get('/:id', zValidator('param', z.object({ id: idSchema })), async (c) => {
  const { id } = c.req.valid('param');
  const result = await getTaskById(id);
  return c.json(successResponse(result));
});

// ── POST /tasks/:id/assign ────────────────────────────────────────────────────

tasks.post(
  '/:id/assign',
  requireAuth,
  idempotencyMiddleware,
  zValidator('param', z.object({ id: idSchema })),
  zValidator('json', z.object({ bidId: idSchema })),
  async (c) => {
    const user = c.get('user')!;
    const { id: taskId } = c.req.valid('param');
    const { bidId } = c.req.valid('json');
    const result = await assignBid({ taskId, posterId: user.id, bidId });
    return c.json(successResponse(result));
  },
);

// ── POST /tasks/:id/submit ────────────────────────────────────────────────────
// Internal — called by the agent runtime or worker after completing the task.

tasks.post(
  '/:id/submit',
  requireAuth,
  zValidator('param', z.object({ id: idSchema })),
  zValidator('json', z.object({ resultText: z.string().min(1).max(100_000) })),
  async (c) => {
    const user = c.get('user')!;
    const { id: taskId } = c.req.valid('param');
    const { resultText } = c.req.valid('json');
    const result = await submitWork({ taskId, agentOwnerId: user.id, resultText });
    return c.json(successResponse(result));
  },
);

// ── POST /tasks/:id/accept ────────────────────────────────────────────────────

tasks.post(
  '/:id/accept',
  requireAuth,
  idempotencyMiddleware,
  zValidator('param', z.object({ id: idSchema })),
  zValidator('json', z.object({
    rating: z.number().int().min(1).max(5),
    reviewText: z.string().max(5000).optional(),
  })),
  async (c) => {
    const user = c.get('user')!;
    const { id: taskId } = c.req.valid('param');
    const { rating, reviewText } = c.req.valid('json');
    const result = await acceptWork({ taskId, posterId: user.id, rating, reviewText });
    return c.json(successResponse(result));
  },
);

// ── POST /tasks/:id/dispute ───────────────────────────────────────────────────

tasks.post(
  '/:id/dispute',
  requireAuth,
  zValidator('param', z.object({ id: idSchema })),
  async (c) => {
    const user = c.get('user')!;
    const { id: taskId } = c.req.valid('param');
    const result = await disputeTask(taskId, user.id);
    return c.json(successResponse(result));
  },
);

// ── GET /tasks/:id/realtime-token ─────────────────────────────────────────────
// Issues a short-lived JWT that authorises the caller to subscribe to this task's
// Socket.IO room. The caller must be the task poster, the assigned agent owner, or an admin.

tasks.get(
  '/:id/realtime-token',
  requireAuth,
  zValidator('param', z.object({ id: idSchema })),
  async (c) => {
    const user = c.get('user')!;
    const { id: taskId } = c.req.valid('param');

    // getTaskById throws NotFoundError if missing — propagates through errorHandler
    const taskResult = await getTaskById(taskId);

    // Only the poster, the assigned agent owner, or admins may subscribe
    const isOwner = taskResult.task.posterId === user.id;
    const isAdmin = user.isAdmin;
    if (!isOwner && !isAdmin) {
      // Assigned agent owners are identified by matching the assignment's agentId owner
      // For now, we gate on poster or admin; the assigned agent will connect via the worker
      return c.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Not authorised to watch this task' } },
        403,
      );
    }

    const token = await issueRealtimeToken({ userId: user.id, taskId, isAdmin });
    return c.json(successResponse({ token }));
  },
);

export default tasks;
