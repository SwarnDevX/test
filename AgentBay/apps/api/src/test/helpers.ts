// Integration test helpers — real Postgres, mocked onchain.
// Requires DATABASE_URL pointing to a test database.
import { getDb, closeDb, users, agents, tasks, bids, assignments, reviews, messages } from '@agentbay/db';
import { ulid } from 'ulid';

// ── DB lifecycle ───────────────────────────────────────────────────────────────

export async function cleanDb() {
  const db = getDb();
  // Delete in reverse FK dependency order
  await db.delete(reviews);
  await db.delete(messages);
  await db.delete(assignments);
  await db.delete(bids);
  await db.delete(tasks);
  await db.delete(agents);
  await db.delete(users);
}

export { closeDb };

// ── Fixture factories ──────────────────────────────────────────────────────────

export interface TestUser {
  id: string;
  walletAddress: string;
}

export async function createTestUser(overrides: Partial<{ walletAddress: string }> = {}): Promise<TestUser> {
  const db = getDb();
  const walletAddress = overrides.walletAddress ?? `0x${ulid().toLowerCase().padEnd(40, '0').slice(0, 40)}`;
  const [user] = await db
    .insert(users)
    .values({ walletAddress })
    .returning({ id: users.id, walletAddress: users.walletAddress });
  if (!user) throw new Error('Failed to create test user');
  return user;
}

export interface TestAgent {
  id: string;
  ownerId: string;
}

export async function createTestAgent(
  ownerId: string,
  overrides: Partial<{ name: string; capabilities: string[] }> = {},
): Promise<TestAgent> {
  const db = getDb();
  const [agent] = await db
    .insert(agents)
    .values({
      ownerId,
      name: overrides.name ?? 'Test Agent',
      description: 'A test agent for integration tests',
      capabilities: overrides.capabilities ?? ['research'],
    })
    .returning({ id: agents.id, ownerId: agents.ownerId });
  if (!agent) throw new Error('Failed to create test agent');
  return agent;
}

export interface TestTask {
  id: string;
  posterId: string;
}

export async function createTestTask(
  posterId: string,
  overrides: Partial<{ status: string; budgetUsdc: bigint }> = {},
): Promise<TestTask> {
  const db = getDb();
  const [task] = await db
    .insert(tasks)
    .values({
      posterId,
      title: 'Test Task',
      description: 'A test task for integration tests. Needs researching.',
      budgetUsdc: overrides.budgetUsdc ?? 1_000_000n,
      tags: [],
      status: (overrides.status as typeof tasks.$inferInsert['status']) ?? 'open',
    })
    .returning({ id: tasks.id, posterId: tasks.posterId });
  if (!task) throw new Error('Failed to create test task');
  return task;
}

export interface TestBid {
  id: string;
  taskId: string;
  agentId: string;
}

export async function createTestBid(
  taskId: string,
  agentId: string,
  overrides: Partial<{ priceUsdc: bigint; status: string }> = {},
): Promise<TestBid> {
  const db = getDb();
  const [bid] = await db
    .insert(bids)
    .values({
      taskId,
      agentId,
      priceUsdc: overrides.priceUsdc ?? 500_000n,
      etaHours: 2,
      status: (overrides.status as typeof bids.$inferInsert['status']) ?? 'pending',
    })
    .returning({ id: bids.id, taskId: bids.taskId, agentId: bids.agentId });
  if (!bid) throw new Error('Failed to create test bid');
  return bid;
}

// ── Request builder ────────────────────────────────────────────────────────────
// Builds a minimal Hono-compatible Request with an injected session cookie.
// In tests, we bypass the real SIWE flow and mock the session lookup.

export function makeRequest(
  method: string,
  path: string,
  opts: { body?: unknown; headers?: Record<string, string> } = {},
): Request {
  const url = `http://localhost:3001${path}`;
  const headers = new Headers(opts.headers ?? {});
  if (opts.body != null) {
    headers.set('Content-Type', 'application/json');
  }
  return new Request(url, {
    method,
    headers,
    body: opts.body != null ? JSON.stringify(opts.body) : undefined,
  });
}
