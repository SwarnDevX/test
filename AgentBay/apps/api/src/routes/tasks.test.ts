// Integration tests for /tasks routes.
// Requires a real Postgres at DATABASE_URL (set in src/test/setup.ts or externally).
// Onchain calldata is null in tests since CONTRACT_TASK_ESCROW_ADDRESS is unset.
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { getDb } from '@agentbay/db';
import { eq } from 'drizzle-orm';

// ── Auth mock (hoisted so it survives vi.mock hoisting) ───────────────────────

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

// ── App + helpers (imported after mocks are registered) ───────────────────────

const { createApp } = await import('../app.js');
const { cleanDb, closeDb, createTestUser, createTestTask, createTestAgent, createTestBid } =
  await import('../test/helpers.js');
const { assignments, bids: bidsTable } = await import('@agentbay/db');

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

describe('GET /tasks', () => {
  beforeEach(async () => { clearUser(); await cleanDb(); });
  afterAll(closeDb);

  it('returns empty list when no tasks exist', async () => {
    const res = await req('GET', '/tasks');
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { data: unknown[]; nextCursor: null } };
    expect(body.ok).toBe(true);
    expect(body.data.data).toHaveLength(0);
    expect(body.data.nextCursor).toBeNull();
  });

  it('returns tasks ordered by id descending', async () => {
    const poster = await createTestUser();
    await createTestTask(poster.id);
    await createTestTask(poster.id);

    const res = await req('GET', '/tasks');
    const body = await res.json() as { ok: boolean; data: { data: Array<{ id: string }> } };
    expect(body.data.data).toHaveLength(2);
    // ULID lexicographic order: newer ID is lexicographically greater
    expect(body.data.data[0]!.id > body.data.data[1]!.id).toBe(true);
  });

  it('filters by status', async () => {
    const poster = await createTestUser();
    await createTestTask(poster.id, { status: 'open' });
    await createTestTask(poster.id, { status: 'assigned' });

    const res = await req('GET', '/tasks?status=open');
    const body = await res.json() as { ok: boolean; data: { data: Array<{ status: string }> } };
    expect(body.data.data).toHaveLength(1);
    expect(body.data.data[0]!.status).toBe('open');
  });

  it('paginates with cursor', async () => {
    const poster = await createTestUser();
    for (let i = 0; i < 3; i++) await createTestTask(poster.id);

    const first = await req('GET', '/tasks?limit=2');
    const firstBody = await first.json() as { ok: boolean; data: { data: Array<{ id: string }>; nextCursor: string } };
    expect(firstBody.data.data).toHaveLength(2);
    expect(firstBody.data.nextCursor).not.toBeNull();

    const second = await req('GET', `/tasks?limit=2&cursor=${firstBody.data.nextCursor}`);
    const secondBody = await second.json() as { ok: boolean; data: { data: unknown[]; nextCursor: null } };
    expect(secondBody.data.data).toHaveLength(1);
    expect(secondBody.data.nextCursor).toBeNull();
  });
});

describe('POST /tasks', () => {
  beforeEach(async () => { clearUser(); await cleanDb(); });

  it('creates a task and returns serialized budgetUsdc', async () => {
    const poster = await createTestUser();
    asUser(poster);

    const res = await req('POST', '/tasks', {
      title: 'Research competitor landscape',
      description: 'Provide a detailed analysis of 5 competitors in the AI agent space.',
      budgetUsdc: '5000000',
      tags: ['research'],
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { ok: boolean; data: { task: { budgetUsdc: string; status: string }; onchain: null } };
    expect(body.ok).toBe(true);
    expect(body.data.task.budgetUsdc).toBe('5000000');
    expect(body.data.task.status).toBe('open');
    expect(body.data.onchain).toBeNull(); // no contract address in test env
  });

  it('returns 401 when not authenticated', async () => {
    const res = await req('POST', '/tasks', {
      title: 'Test', description: 'A task with enough description text.', budgetUsdc: '1000000',
    });
    expect(res.status).toBe(401);
  });

  it('validates minimum description length', async () => {
    const poster = await createTestUser();
    asUser(poster);

    const res = await req('POST', '/tasks', {
      title: 'Test', description: 'short', budgetUsdc: '1000000',
    });
    expect(res.status).toBe(400);
  });

  it('validates budgetUsdc must be numeric string', async () => {
    const poster = await createTestUser();
    asUser(poster);

    const res = await req('POST', '/tasks', {
      title: 'Test', description: 'A description that is long enough to pass validation.', budgetUsdc: 'not-a-number',
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /tasks/:id', () => {
  beforeEach(async () => { clearUser(); await cleanDb(); });

  it('returns task with bids and null assignment', async () => {
    const poster = await createTestUser();
    const task = await createTestTask(poster.id);
    const agentOwner = await createTestUser();
    const agent = await createTestAgent(agentOwner.id);
    await createTestBid(task.id, agent.id);

    const res = await req('GET', `/tasks/${task.id}`);
    expect(res.status).toBe(200);
    const body = await res.json() as {
      ok: boolean;
      data: { task: { id: string }; bids: unknown[]; assignment: null };
    };
    expect(body.data.task.id).toBe(task.id);
    expect(body.data.bids).toHaveLength(1);
    expect(body.data.assignment).toBeNull();
  });

  it('returns 404 for unknown id', async () => {
    const res = await req('GET', '/tasks/01JXXXXXXXXXXXXXXXXXXXXXXXXX');
    expect(res.status).toBe(404);
  });
});

describe('POST /tasks/:id/assign', () => {
  beforeEach(async () => { clearUser(); await cleanDb(); });

  it('assigns bid and transitions task to assigned', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);
    const bid = await createTestBid(task.id, agent.id);

    asUser(poster);
    const res = await req('POST', `/tasks/${task.id}/assign`, { bidId: bid.id });

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { task: { status: string }; assignment: { bidId: string } } };
    expect(body.data.task.status).toBe('assigned');
    expect(body.data.assignment.bidId).toBe(bid.id);
  });

  it('returns 403 when non-poster tries to assign', async () => {
    const poster = await createTestUser();
    const other = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent = await createTestAgent(agentOwner.id);
    const bid = await createTestBid(task.id, agent.id);

    asUser(other);
    const res = await req('POST', `/tasks/${task.id}/assign`, { bidId: bid.id });
    expect(res.status).toBe(403);
  });

  it('returns 409 when task is not open', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id, { status: 'assigned' });
    const agent = await createTestAgent(agentOwner.id);
    const bid = await createTestBid(task.id, agent.id);

    asUser(poster);
    const res = await req('POST', `/tasks/${task.id}/assign`, { bidId: bid.id });
    expect(res.status).toBe(409);
  });

  it('rejects all other pending bids when one is accepted', async () => {
    const poster = await createTestUser();
    const agentOwner1 = await createTestUser();
    const agentOwner2 = await createTestUser();
    const task = await createTestTask(poster.id);
    const agent1 = await createTestAgent(agentOwner1.id);
    const agent2 = await createTestAgent(agentOwner2.id);
    const bid1 = await createTestBid(task.id, agent1.id);
    await createTestBid(task.id, agent2.id);

    asUser(poster);
    await req('POST', `/tasks/${task.id}/assign`, { bidId: bid1.id });

    const db = getDb();
    const allBids = await db.select().from(bidsTable).where(eq(bidsTable.taskId, task.id));
    expect(allBids.filter((b) => b.status === 'accepted')).toHaveLength(1);
    expect(allBids.filter((b) => b.status === 'rejected')).toHaveLength(1);
  });
});

describe('POST /tasks/:id/accept', () => {
  beforeEach(async () => { clearUser(); await cleanDb(); });

  it('transitions submitted task to reviewing and writes review', async () => {
    const poster = await createTestUser();
    const agentOwner = await createTestUser();
    const task = await createTestTask(poster.id, { status: 'submitted' });
    const agent = await createTestAgent(agentOwner.id);
    const bid = await createTestBid(task.id, agent.id, { status: 'accepted' });

    const db = getDb();
    await db.insert(assignments).values({
      taskId: task.id,
      bidId: bid.id,
      agentId: agent.id,
      status: 'submitted',
    });

    asUser(poster);
    const res = await req('POST', `/tasks/${task.id}/accept`, { rating: 5, reviewText: 'Great work!' });

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { task: { status: string } } };
    expect(body.data.task.status).toBe('reviewing');
  });

  it('returns 409 when task is not submitted', async () => {
    const poster = await createTestUser();
    const task = await createTestTask(poster.id, { status: 'open' });

    asUser(poster);
    const res = await req('POST', `/tasks/${task.id}/accept`, { rating: 4 });
    expect(res.status).toBe(409);
  });
});

describe('POST /tasks/:id/dispute', () => {
  beforeEach(async () => { clearUser(); await cleanDb(); });

  it('transitions submitted task to disputed', async () => {
    const poster = await createTestUser();
    const task = await createTestTask(poster.id, { status: 'submitted' });

    asUser(poster);
    const res = await req('POST', `/tasks/${task.id}/dispute`);

    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; data: { task: { status: string } } };
    expect(body.data.task.status).toBe('disputed');
  });

  it('returns 409 when task is not submitted', async () => {
    const poster = await createTestUser();
    const task = await createTestTask(poster.id, { status: 'open' });

    asUser(poster);
    const res = await req('POST', `/tasks/${task.id}/dispute`);
    expect(res.status).toBe(409);
  });

  it('returns 403 when non-poster disputes', async () => {
    const poster = await createTestUser();
    const other = await createTestUser();
    const task = await createTestTask(poster.id, { status: 'submitted' });

    asUser(other);
    const res = await req('POST', `/tasks/${task.id}/dispute`);
    expect(res.status).toBe(403);
  });
});
