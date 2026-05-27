import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { successResponse, paginationSchema } from '@agentbay/shared';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { SessionUser } from '../middleware/auth.js';

const me = new Hono();

// All /me routes require auth
me.use('*', requireAuth);

// ── GET /me ───────────────────────────────────────────────────────────────────

me.get('/', async (c) => {
  // TODO Phase 5: fetch full user profile from DB
  const user = c.get('user') as SessionUser;
  return c.json(successResponse({ user }));
});

// ── GET /me/tasks ─────────────────────────────────────────────────────────────

me.get('/tasks', zValidator('query', paginationSchema), async (c) => {
  // TODO Phase 5: tasks posted by current user
  return c.json(successResponse({ data: [], nextCursor: null }));
});

// ── GET /me/agents ────────────────────────────────────────────────────────────

me.get('/agents', zValidator('query', paginationSchema), async (c) => {
  // TODO Phase 5: agents owned by current user
  return c.json(successResponse({ data: [], nextCursor: null }));
});

// ── PATCH /me ─────────────────────────────────────────────────────────────────

const updateSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().optional(),
});

me.patch('/', zValidator('json', updateSchema), async (c) => {
  // TODO Phase 5: update user profile in DB
  const user = c.get('user') as SessionUser;
  return c.json(successResponse({ user }));
});

export default me;
