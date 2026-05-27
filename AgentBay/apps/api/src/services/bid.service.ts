// Bid service — DB operations for agent bids on tasks.
import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb, bids, tasks, agents } from '@agentbay/db';
import type { Bid } from '@agentbay/db';
import { NotFoundError, ForbiddenError, ConflictError } from '@agentbay/shared';

// ── Serializer ─────────────────────────────────────────────────────────────────

function serializeBid(b: Bid) {
  return {
    id: b.id,
    taskId: b.taskId,
    agentId: b.agentId,
    priceUsdc: b.priceUsdc.toString(),
    etaHours: b.etaHours,
    sampleOutput: b.sampleOutput,
    coverNote: b.coverNote,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// ── listBidsForTask ────────────────────────────────────────────────────────────

export async function listBidsForTask(taskId: string) {
  const db = getDb();

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) throw new NotFoundError(`Task ${taskId} not found`);

  const rows = await db
    .select()
    .from(bids)
    .where(eq(bids.taskId, taskId))
    .orderBy(desc(bids.createdAt));

  return rows.map(serializeBid);
}

// ── createBid ──────────────────────────────────────────────────────────────────

export interface CreateBidInput {
  taskId: string;
  agentId: string;
  bidderId: string;
  priceUsdc: string;
  etaHours: number;
  sampleOutput?: string;
  coverNote?: string;
}

export async function createBid(input: CreateBidInput) {
  const db = getDb();
  const { taskId, agentId, bidderId } = input;

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) throw new NotFoundError(`Task ${taskId} not found`);
  if (task.status !== 'open') throw new ConflictError(`Task is ${task.status}, bidding is closed`);

  // Poster cannot bid on their own task
  if (task.posterId === bidderId) throw new ForbiddenError('Task poster cannot bid on their own task');

  // Verify bidder owns the agent
  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), isNull(agents.deletedAt)))
    .limit(1);

  if (!agent) throw new NotFoundError(`Agent ${agentId} not found`);
  if (agent.ownerId !== bidderId) throw new ForbiddenError('You do not own this agent');
  if (!agent.isActive) throw new ConflictError('Agent is not active');

  // Prevent duplicate bids from the same agent
  const [existing] = await db
    .select()
    .from(bids)
    .where(
      and(
        eq(bids.taskId, taskId),
        eq(bids.agentId, agentId),
        eq(bids.status, 'pending'),
      ),
    )
    .limit(1);

  if (existing) throw new ConflictError('This agent already has a pending bid on this task');

  const [bid] = await db
    .insert(bids)
    .values({
      taskId,
      agentId,
      priceUsdc: BigInt(input.priceUsdc),
      etaHours: input.etaHours,
      sampleOutput: input.sampleOutput ?? null,
      coverNote: input.coverNote ?? null,
      status: 'pending',
    })
    .returning();

  if (!bid) throw new Error('Insert failed');
  return serializeBid(bid);
}

// ── withdrawBid ────────────────────────────────────────────────────────────────

export async function withdrawBid(taskId: string, bidId: string, requesterId: string) {
  const db = getDb();

  const [bid] = await db
    .select()
    .from(bids)
    .where(and(eq(bids.id, bidId), eq(bids.taskId, taskId)))
    .limit(1);

  if (!bid) throw new NotFoundError(`Bid ${bidId} not found on task ${taskId}`);
  if (bid.status !== 'pending') throw new ConflictError(`Bid is ${bid.status}, only pending bids can be withdrawn`);

  // Verify requester owns the agent
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, bid.agentId))
    .limit(1);

  if (!agent || agent.ownerId !== requesterId) {
    throw new ForbiddenError('Only the bid owner can withdraw it');
  }

  const [updated] = await db
    .update(bids)
    .set({ status: 'withdrawn', updatedAt: new Date() })
    .where(eq(bids.id, bidId))
    .returning();

  if (!updated) throw new Error('Update failed');
  return serializeBid(updated);
}
