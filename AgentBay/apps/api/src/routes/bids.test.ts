// Integration tests for /tasks/:taskId/bids routes.
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';

// ── Auth mock ─────────────────────────────────────────────────────────────────

const authState = vi.hoisted(() => ({
  user: null as { id: string; walletAddress: string; isAdmin: boolean } | null,
}));

vi.mock('../middleware/auth.js', () => ({
  sessionMiddleware: (_c: unknown, next: () => Promise<void>) => next(),
  requireAuth: (c: { set(k: string, v: unknown): void; json(b: unknown, s?: number): Response }, next: () => Promise<void>) => {
    if (!authState.user) {
      return c.json({ ok: false, error: { code: 'AUTH_ERROR', message: 'Not authenticated', requestId: 'test' } }, 401);
    }
    c.set('user', authState.user);
    return next();
  },
  requireAdmin: (_c: unknown, next: () => Promise<void>) => next(),
  createSession: vi.fn(),
  destroySession: vi.fn(),
  getSession: vi.fn(),
  makeSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock('../middleware/idempotency.js', () => ({
  idempotencyMiddleware: (_c: unknown, next: () => Promise<void>) => next(),
}));

vi.mock('../middleware/rateLimit.js', () => ({
  globalRateLimit: (_c: unknown, next: () => Promise<void>) => next(),
  rateLimit: () => (_c: unknown, next: () => Promise<void>) => next(),
}));

vi.mock('../config/redis.js', () => ({
  getRedis: () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn(), setex: vi.fn() }),
}));

// ── App + helpers ─────────────────────────────────────────────────────────────

const { createApp } = await import('../app.js');
const { cleanDb, closeDb, createTestUser, createTestTask, createTestAgent, createTestBid } =
  await import('../test/helpers.js');

const app = createApp();

function asUser(user: { id: string; walletAddress: string }) {
  authState.user = { id: user.id, walletAddress: user.walletAddress, isAdmin: false };
}
function clearUser() { authState.user = null; }

async function req(method: string, path: string, body?: unknown) {
  const headers = new Headers();
  if (body != null) headers.set('Content-Type', 'application/json');
  return app.fetch(new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /tasks/:taskId/bids', () => {
  beforeEach(async () => { clearUser(); await cleanDb(); });
  afterAll(closeDb);

  it('returns bids for a task with serialized priceUsdc', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);
    await createTestBid(task.id, agent.id);

    const res = await req('GET', `/tasks/${task.id}/bids`);
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { data: Array<{ priceUsdc: string; status: string }> } };
    expect(body.ok).toBe(true);
    expect(body.data.data).toHaveLength(1);
    expect(body.data.data[0]!.priceUsdc).toBe('500000');
    expect(body.data.data[0]!.status).toBe('pending');
  });

  it('returns 404 when task does not exist', async () => {
    const res = await req('GET', '/tasks/01JXXXXXXXXXXXXXXXXXXXXXXXXX/bids');
    expect(res.status).toBe(404);
  });

  it('returns empty array when task has no bids', async () => {
    const poster = await createTestUser();
    const task = await createTestTask(poster.id);

    const res = await req('GET', `/tasks/${task.id}/bids`);
    const body = await res.json() as { ok: boolean; data: { data: unknown[] } };
    expect(body.data.data).toHaveLength(0);
  });
});

describe('POST /tasks/:taskId/bids', () => {
  beforeEach(async () => { clearUser(); await cleanDb(); });

  it('creates a bid from an agent owner', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);

    asUser(agentOwner);
    const res = await req('POST', `/tasks/${task.id}/bids`, {
      agentId: agent.id,
      priceUsdc: '750000',
      etaHours: 4,
      coverNote: 'Happy to help with this task.',
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { ok: boolean; data: { priceUsdc: string; status: string; agentId: string } };
    expect(body.ok).toBe(true);
    expect(body.data.priceUsdc).toBe('750000');
    expect(body.data.status).toBe('pending');
    expect(body.data.agentId).toBe(agent.id);
  });

  it('returns 401 when not authenticated', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);

    const res = await req('POST', `/tasks/${task.id}/bids`, {
      agentId: agent.id, priceUsdc: '500000', etaHours: 2,
    });
    expect(res.status).toBe(401);
  });

  it('prevents poster from bidding on their own task', async () => {
    const poster = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(poster.id);

    asUser(poster);
    const res = await req('POST', `/tasks/${task.id}/bids`, {
      agentId: agent.id, priceUsdc: '500000', etaHours: 2,
    });
    expect(res.status).toBe(403);
  });

  it('prevents duplicate pending bids from the same agent', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);
    await createTestBid(task.id, agent.id); // existing pending bid

    asUser(agentOwner);
    const res = await req('POST', `/tasks/${task.id}/bids`, {
      agentId: agent.id, priceUsdc: '600000', etaHours: 3,
    });
    expect(res.status).toBe(409);
  });

  it('returns 409 when task is not open', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id, { status: 'assigned' });
    const agent = await createTestAgent(agentOwner.id);

    asUser(agentOwner);
    const res = await req('POST', `/tasks/${task.id}/bids`, {
      agentId: agent.id, priceUsdc: '500000', etaHours: 2,
    });
    expect(res.status).toBe(409);
  });

  it('returns 403 when agent is not owned by requester', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const imposter = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);

    asUser(imposter);
    const res = await req('POST', `/tasks/${task.id}/bids`, {
      agentId: agent.id, priceUsdc: '500000', etaHours: 2,
    });
    expect(res.status).toBe(403);
  });

  it('validates etaHours range', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);

    asUser(agentOwner);
    const res = await req('POST', `/tasks/${task.id}/bids`, {
      agentId: agent.id, priceUsdc: '500000', etaHours: 0, // below min
    });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /tasks/:taskId/bids/:bidId', () => {
  beforeEach(async () => { clearUser(); await cleanDb(); });

  it('withdraws a pending bid', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);
    const bid = await createTestBid(task.id, agent.id);

    asUser(agentOwner);
    const res = await req('DELETE', `/tasks/${task.id}/bids/${bid.id}`);

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { status: string } };
    expect(body.data.status).toBe('withdrawn');
  });

  it('returns 403 when non-owner tries to withdraw', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const other = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);
    const bid = await createTestBid(task.id, agent.id);

    asUser(other);
    const res = await req('DELETE', `/tasks/${task.id}/bids/${bid.id}`);
    expect(res.status).toBe(403);
  });

  it('returns 409 when bid is already accepted', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);
    const bid = await createTestBid(task.id, agent.id, { status: 'accepted' });

    asUser(agentOwner);
    const res = await req('DELETE', `/tasks/${task.id}/bids/${bid.id}`);
    expect(res.status).toBe(409);
  });

  it('returns 404 when bid does not exist', async () => {
    const poster = await createTestUser();
    const task = await createTestTask(poster.id);
    const agentOwner = await createTestUser();
    asUser(agentOwner);

    const res = await req('DELETE', `/tasks/${task.id}/bids/01JXXXXXXXXXXXXXXXXXXXXXXXXX`);
    expect(res.status).toBe(404);
  });
});
