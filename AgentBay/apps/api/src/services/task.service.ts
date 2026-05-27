// Task service — all DB operations for tasks, bids, and assignments.
// Onchain calldata is returned for the client to sign; workers (Phase 6) confirm settlement.
import { and, asc, desc, eq, isNull, lt, ne, sql } from 'drizzle-orm';
import { encodeFunctionData, keccak256, toHex } from 'viem';
import type { Hex } from 'viem';
import { getDb, tasks, bids, assignments, agents, reviews, messages } from '@agentbay/db';
import type { Task, Bid, Assignment, Message } from '@agentbay/db';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '@agentbay/shared';
import { taskEscrowAbi } from '@agentbay/contracts';
import { env } from '../config/env.js';
import { enqueueTaskExecute, enqueueTaskSettle } from '../lib/jobQueue.js';

// ── Serializers ────────────────────────────────────────────────────────────────

function serializeTask(t: Task) {
  return {
    id: t.id,
    posterId: t.posterId,
    title: t.title,
    description: t.description,
    budgetUsdc: t.budgetUsdc.toString(),
    status: t.status,
    onchainTaskId: t.onchainTaskId,
    onchainTaskHash: t.onchainTaskHash,
    resultHash: t.resultHash,
    tags: t.tags,
    deadline: t.deadline?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

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

function serializeMessage(m: Message) {
  return {
    id: m.id,
    taskId: m.taskId,
    senderId: m.senderId,
    agentId: m.agentId,
    role: m.role,
    content: m.content,
    metadata: m.metadata ?? null,
    createdAt: m.createdAt.toISOString(),
  };
}

function serializeAssignment(a: Assignment) {
  return {
    id: a.id,
    taskId: a.taskId,
    bidId: a.bidId,
    agentId: a.agentId,
    status: a.status,
    startedAt: a.startedAt?.toISOString() ?? null,
    submittedAt: a.submittedAt?.toISOString() ?? null,
    completedAt: a.completedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

// ── Onchain calldata helpers ───────────────────────────────────────────────────

type OnchainCalldata = { contractAddress: string; calldata: Hex } | null;

function encodeCreateTask(taskHash: Hex, amount: bigint): OnchainCalldata {
  if (!env.CONTRACT_TASK_ESCROW_ADDRESS) return null;
  return {
    contractAddress: env.CONTRACT_TASK_ESCROW_ADDRESS,
    calldata: encodeFunctionData({
      abi: taskEscrowAbi,
      functionName: 'createTask',
      args: [taskHash, amount],
    }),
  };
}

function encodeAcceptWork(onchainTaskId: bigint, rating: number, reviewHash: Hex): OnchainCalldata {
  if (!env.CONTRACT_TASK_ESCROW_ADDRESS) return null;
  return {
    contractAddress: env.CONTRACT_TASK_ESCROW_ADDRESS,
    calldata: encodeFunctionData({
      abi: taskEscrowAbi,
      functionName: 'acceptWork',
      args: [onchainTaskId, rating, reviewHash],
    }),
  };
}

function encodeDispute(onchainTaskId: bigint): OnchainCalldata {
  if (!env.CONTRACT_TASK_ESCROW_ADDRESS) return null;
  return {
    contractAddress: env.CONTRACT_TASK_ESCROW_ADDRESS,
    calldata: encodeFunctionData({
      abi: taskEscrowAbi,
      functionName: 'dispute',
      args: [onchainTaskId],
    }),
  };
}

// ── createTask ─────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  posterId: string;
  title: string;
  description: string;
  budgetUsdc: string;
  tags: string[];
  deadline?: string;
}

export async function createTask(input: CreateTaskInput) {
  const db = getDb();
  const amount = BigInt(input.budgetUsdc);
  if (amount <= 0n) throw new ValidationError('budgetUsdc must be positive');

  const taskHash = keccak256(toHex(input.description)) as Hex;

  const [task] = await db
    .insert(tasks)
    .values({
      posterId: input.posterId,
      title: input.title,
      description: input.description,
      budgetUsdc: amount,
      tags: input.tags,
      deadline: input.deadline != null ? new Date(input.deadline) : null,
      onchainTaskHash: taskHash,
      status: 'open',
    })
    .returning();

  if (!task) throw new Error('Insert failed');

  return {
    task: serializeTask(task),
    onchain: encodeCreateTask(taskHash, amount),
  };
}

// ── listTasks ──────────────────────────────────────────────────────────────────

export async function listTasks(opts: {
  cursor?: string;
  limit: number;
  status?: string;
  tag?: string;
}) {
  const db = getDb();
  const { cursor, limit, status, tag } = opts;

  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(
        isNull(tasks.deletedAt),
        cursor != null ? lt(tasks.id, cursor) : undefined,
        status != null ? eq(tasks.status, status as Task['status']) : undefined,
        tag != null ? sql`${tasks.tags} @> ARRAY[${tag}]::text[]` : undefined,
      ),
    )
    .orderBy(desc(tasks.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (data.at(-1)?.id ?? null) : null;

  return { data: data.map(serializeTask), nextCursor };
}

// ── getTaskById ────────────────────────────────────────────────────────────────

export async function getTaskById(id: string) {
  const db = getDb();

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) throw new NotFoundError(`Task ${id} not found`);

  const [taskBids, [assignment], taskMessages] = await Promise.all([
    db.select().from(bids).where(eq(bids.taskId, id)).orderBy(desc(bids.createdAt)),
    db.select().from(assignments).where(eq(assignments.taskId, id)).limit(1),
    db.select().from(messages).where(eq(messages.taskId, id)).orderBy(asc(messages.createdAt)),
  ]);

  return {
    task: serializeTask(task),
    bids: taskBids.map(serializeBid),
    assignment: assignment != null ? serializeAssignment(assignment) : null,
    messages: taskMessages.map(serializeMessage),
  };
}

// ── assignBid ──────────────────────────────────────────────────────────────────

export interface AssignBidInput {
  taskId: string;
  posterId: string;
  bidId: string;
}

export async function assignBid(input: AssignBidInput) {
  const db = getDb();
  const { taskId, posterId, bidId } = input;

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) throw new NotFoundError(`Task ${taskId} not found`);
  if (task.posterId !== posterId) throw new ForbiddenError('Only the task poster can assign a bid');
  if (task.status !== 'open') throw new ConflictError(`Task is ${task.status}, must be open to assign`);

  const [bid] = await db
    .select()
    .from(bids)
    .where(and(eq(bids.id, bidId), eq(bids.taskId, taskId)))
    .limit(1);

  if (!bid) throw new NotFoundError(`Bid ${bidId} not found on task ${taskId}`);
  if (bid.status !== 'pending') throw new ConflictError(`Bid is ${bid.status}, must be pending to accept`);

  const now = new Date();

  const result = await db.transaction(async (tx) => {
    // Reject all other pending bids on this task
    await tx
      .update(bids)
      .set({ status: 'rejected', updatedAt: now })
      .where(and(eq(bids.taskId, taskId), ne(bids.id, bidId), eq(bids.status, 'pending')));

    // Accept the chosen bid
    await tx.update(bids).set({ status: 'accepted', updatedAt: now }).where(eq(bids.id, bidId));

    // Update task status
    const [updatedTask] = await tx
      .update(tasks)
      .set({ status: 'assigned', updatedAt: now })
      .where(eq(tasks.id, taskId))
      .returning();

    // Create assignment record
    const [newAssignment] = await tx
      .insert(assignments)
      .values({
        taskId,
        bidId,
        agentId: bid.agentId,
        status: 'active',
        startedAt: now,
      })
      .returning();

    return { updatedTask, newAssignment };
  });

  if (!result.updatedTask || !result.newAssignment) throw new Error('Transaction failed');

  // Fire-and-forget: enqueue the agent execution job
  await enqueueTaskExecute({
    taskId,
    assignmentId: result.newAssignment.id,
    agentId: bid.agentId,
  });

  return {
    task: serializeTask(result.updatedTask),
    assignment: serializeAssignment(result.newAssignment),
    onchain: null as OnchainCalldata,
  };
}

// ── submitWork ─────────────────────────────────────────────────────────────────
// Internal endpoint — only the owner of the assigned agent can submit.

export interface SubmitWorkInput {
  taskId: string;
  agentOwnerId: string;
  resultText: string;
}

export async function submitWork(input: SubmitWorkInput) {
  const db = getDb();
  const { taskId, agentOwnerId, resultText } = input;

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) throw new NotFoundError(`Task ${taskId} not found`);
  if (task.status !== 'assigned') throw new ConflictError(`Task is ${task.status}, must be assigned`);

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.taskId, taskId))
    .limit(1);

  if (!assignment) throw new NotFoundError('No active assignment found');

  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.id, assignment.agentId))
    .limit(1);

  if (!agent || agent.ownerId !== agentOwnerId) {
    throw new ForbiddenError('Only the assigned agent owner can submit work');
  }

  const resultHash = keccak256(toHex(resultText)) as Hex;
  const now = new Date();

  const updatedTask = await db.transaction(async (tx) => {
    const [t] = await tx
      .update(tasks)
      .set({ status: 'submitted', resultHash, updatedAt: now })
      .where(eq(tasks.id, taskId))
      .returning();

    await tx
      .update(assignments)
      .set({ status: 'submitted', submittedAt: now, updatedAt: now })
      .where(eq(assignments.id, assignment.id));

    return t;
  });

  if (!updatedTask) throw new Error('Transaction failed');
  return { task: serializeTask(updatedTask), resultHash };
}

// ── acceptWork ─────────────────────────────────────────────────────────────────

export interface AcceptWorkInput {
  taskId: string;
  posterId: string;
  rating: number;
  reviewText?: string;
}

export async function acceptWork(input: AcceptWorkInput) {
  const db = getDb();
  const { taskId, posterId, rating, reviewText } = input;

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) throw new NotFoundError(`Task ${taskId} not found`);
  if (task.posterId !== posterId) throw new ForbiddenError('Only the task poster can accept work');
  if (task.status !== 'submitted') throw new ConflictError(`Task is ${task.status}, must be submitted`);

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.taskId, taskId))
    .limit(1);

  if (!assignment) throw new NotFoundError('No assignment found');

  const reviewHash = keccak256(toHex(reviewText ?? '')) as Hex;
  const now = new Date();

  const updatedTask = await db.transaction(async (tx) => {
    const [t] = await tx
      .update(tasks)
      .set({ status: 'reviewing', updatedAt: now })
      .where(eq(tasks.id, taskId))
      .returning();

    await tx.insert(reviews).values({
      taskId,
      agentId: assignment.agentId,
      reviewerId: posterId,
      rating,
      reviewText: reviewText ?? null,
      onchainHash: reviewHash,
    });

    // Update cached reputation on agent
    const [agentRow] = await tx
      .select()
      .from(agents)
      .where(eq(agents.id, assignment.agentId))
      .limit(1);

    if (agentRow) {
      const newCount = agentRow.reviewCount + 1;
      const newScore = Math.round(
        (agentRow.reputationScore * agentRow.reviewCount + rating * 100) / newCount,
      );
      await tx
        .update(agents)
        .set({ reputationScore: newScore, reviewCount: newCount, updatedAt: now })
        .where(eq(agents.id, assignment.agentId));
    }

    return t;
  });

  if (!updatedTask) throw new Error('Transaction failed');

  const onchain =
    task.onchainTaskId != null
      ? encodeAcceptWork(BigInt(task.onchainTaskId), rating, reviewHash)
      : null;

  // Enqueue settle job — worker will finalise DB + record transaction once confirmed onchain
  await enqueueTaskSettle({
    taskId,
    resultHash: task.resultHash ?? reviewHash,
  });

  return { task: serializeTask(updatedTask), onchain };
}

// ── disputeTask ────────────────────────────────────────────────────────────────

export async function disputeTask(taskId: string, posterId: string) {
  const db = getDb();

  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), isNull(tasks.deletedAt)))
    .limit(1);

  if (!task) throw new NotFoundError(`Task ${taskId} not found`);
  if (task.posterId !== posterId) throw new ForbiddenError('Only the task poster can dispute');
  if (task.status !== 'submitted') throw new ConflictError(`Task is ${task.status}, must be submitted`);

  const [updatedTask] = await db
    .update(tasks)
    .set({ status: 'disputed', updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!updatedTask) throw new Error('Update failed');

  const onchain =
    task.onchainTaskId != null ? encodeDispute(BigInt(task.onchainTaskId)) : null;

  return { task: serializeTask(updatedTask), onchain };
}
