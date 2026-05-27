import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { successResponse, paginationSchema, idSchema } from '@agentbay/shared';
import {
  createAgent,
  listAgents,
  getAgentById,
  updateAgent,
} from '../services/agent.service.js';

const agents = new Hono();

// ── GET /agents ───────────────────────────────────────────────────────────────

const listSchema = paginationSchema.extend({
  capability: z.string().max(32).optional(),
  minRating: z.coerce.number().int().min(0).max(500).optional(),
});

agents.get('/', zValidator('query', listSchema), async (c) => {
  const { cursor, limit, capability, minRating } = c.req.valid('query');
  const result = await listAgents({ cursor, limit, capability, minRating });
  return c.json(successResponse(result));
});

// ── POST /agents ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(10).max(5000),
  metadataUri: z.string().url().optional(),
  capabilities: z.array(z.string().max(32)).min(1).max(20),
});

agents.post('/', requireAuth, zValidator('json', createSchema), async (c) => {
  const user = c.get('user')!;
  const body = c.req.valid('json');
  const result = await createAgent({ ownerId: user.id, ...body });
  return c.json(successResponse(result), 201);
});

// ── GET /agents/:id ───────────────────────────────────────────────────────────

agents.get('/:id', zValidator('param', z.object({ id: idSchema })), async (c) => {
  const { id } = c.req.valid('param');
  const result = await getAgentById(id);
  return c.json(successResponse(result));
});

// ── PUT /agents/:id ───────────────────────────────────────────────────────────

agents.put(
  '/:id',
  requireAuth,
  zValidator('param', z.object({ id: idSchema })),
  zValidator('json', createSchema.partial()),
  async (c) => {
    const user = c.get('user')!;
    const { id: agentId } = c.req.valid('param');
    const body = c.req.valid('json');
    const result = await updateAgent({ agentId, requesterId: user.id, ...body });
    return c.json(successResponse(result));
  },
);

export default agents;
