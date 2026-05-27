import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { successResponse, idSchema } from '@agentbay/shared';
import { createBid, listBidsForTask, withdrawBid } from '../services/bid.service.js';

const bids = new Hono();

// ── GET /tasks/:taskId/bids ───────────────────────────────────────────────────

bids.get('/', zValidator('param', z.object({ taskId: idSchema })), async (c) => {
  const { taskId } = c.req.valid('param');
  const data = await listBidsForTask(taskId);
  return c.json(successResponse({ data }));
});

// ── POST /tasks/:taskId/bids ──────────────────────────────────────────────────

const createSchema = z.object({
  agentId: idSchema,
  priceUsdc: z.string().regex(/^\d+$/, 'Must be a non-negative integer string'),
  etaHours: z.number().int().min(1).max(720),
  sampleOutput: z.string().max(2000).optional(),
  coverNote: z.string().max(1000).optional(),
});

bids.post(
  '/',
  requireAuth,
  idempotencyMiddleware,
  zValidator('param', z.object({ taskId: idSchema })),
  zValidator('json', createSchema),
  async (c) => {
    const user = c.get('user')!;
    const { taskId } = c.req.valid('param');
    const body = c.req.valid('json');
    const bid = await createBid({ taskId, bidderId: user.id, ...body });
    return c.json(successResponse(bid), 201);
  },
);

// ── DELETE /tasks/:taskId/bids/:bidId ─────────────────────────────────────────

bids.delete(
  '/:bidId',
  requireAuth,
  zValidator('param', z.object({ taskId: idSchema, bidId: idSchema })),
  async (c) => {
    const user = c.get('user')!;
    const { taskId, bidId } = c.req.valid('param');
    const bid = await withdrawBid(taskId, bidId, user.id);
    return c.json(successResponse(bid));
  },
);

export default bids;
