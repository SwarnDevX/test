// webhook.process worker — handles decoded onchain events ingested by the viem listener (Phase 7).
// Each event updates the DB to reflect the canonical onchain state.
// All bigints arrive as strings in job.data.data (serialised by the listener before enqueuing).
import { Worker, type Job } from 'bullmq';
import { eq, and } from 'drizzle-orm';
import { getDb, tasks, assignments, transactions, webhooksInbox } from '@agentbay/db';
import { QUEUE_NAMES, type WebhookProcessJob } from '@agentbay/shared';
import { getBullmqRedis } from '../config/redis.js';
import { enqueueTaskSettle } from '../queues/index.js';
import { env } from '../config/env.js';

const WORKER_NAME = 'webhook.process';

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleTaskCreated(data: Record<string, unknown>, _txHash: string): Promise<void> {
  const onchainTaskId = String(data['taskId'] ?? data['id'] ?? '');
  const taskHash = String(data['taskHash'] ?? '');
  if (!onchainTaskId || !taskHash) return;

  const db = getDb();
  await db
    .update(tasks)
    .set({ onchainTaskId, onchainTaskHash: taskHash, updatedAt: new Date() })
    .where(and(eq(tasks.onchainTaskHash, taskHash)));
}

async function handleAgentAssigned(data: Record<string, unknown>): Promise<void> {
  const onchainTaskId = String(data['taskId'] ?? '');
  if (!onchainTaskId) return;

  const db = getDb();
  await db
    .update(tasks)
    .set({ status: 'assigned', updatedAt: new Date() })
    .where(and(eq(tasks.onchainTaskId, onchainTaskId), eq(tasks.status, 'open')));
}

async function handleWorkSubmitted(data: Record<string, unknown>): Promise<void> {
  const onchainTaskId = String(data['taskId'] ?? '');
  const resultHash = String(data['resultHash'] ?? '');
  if (!onchainTaskId) return;

  const db = getDb();
  await db
    .update(tasks)
    .set({ status: 'submitted', resultHash: resultHash || undefined, updatedAt: new Date() })
    .where(and(eq(tasks.onchainTaskId, onchainTaskId), eq(tasks.status, 'assigned')));
}

async function handleWorkAccepted(
  data: Record<string, unknown>,
  txHash: string,
): Promise<void> {
  const onchainTaskId = String(data['taskId'] ?? '');
  const resultHash = String(data['resultHash'] ?? '');
  const agentWallet = String(data['agentWallet'] ?? data['agent'] ?? '');
  const amountUsdc = String(data['amount'] ?? '0');

  if (!onchainTaskId) return;

  const db = getDb();
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.onchainTaskId, onchainTaskId))
    .limit(1);

  if (!task) return;

  // Move to reviewing — the settle worker will move it to completed
  await db
    .update(tasks)
    .set({ status: 'reviewing', updatedAt: new Date() })
    .where(eq(tasks.id, task.id));

  // Enqueue the settle job
  await enqueueTaskSettle({
    taskId: task.id,
    resultHash,
    txHash,
    amountUsdc,
    agentWallet: agentWallet || undefined,
  });
}

async function handleTaskDisputed(data: Record<string, unknown>): Promise<void> {
  const onchainTaskId = String(data['taskId'] ?? '');
  if (!onchainTaskId) return;

  const db = getDb();
  const [task] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.onchainTaskId, onchainTaskId))
    .limit(1);

  if (!task) return;

  const now = new Date();
  await db
    .update(tasks)
    .set({ status: 'disputed', updatedAt: now })
    .where(eq(tasks.id, task.id));

  await db
    .update(assignments)
    .set({ status: 'disputed', updatedAt: now })
    .where(eq(assignments.taskId, task.id));
}

async function handleDisputeResolved(
  data: Record<string, unknown>,
  txHash: string,
): Promise<void> {
  const onchainTaskId = String(data['taskId'] ?? '');
  const releaseToAgent = Boolean(data['releaseToAgent'] ?? data['winner']);
  const amount = String(data['amount'] ?? '0');

  if (!onchainTaskId) return;

  const db = getDb();
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.onchainTaskId, onchainTaskId))
    .limit(1);

  if (!task) return;

  const newStatus = releaseToAgent ? 'completed' : 'refunded';
  const txType = releaseToAgent ? 'escrow_release' : 'escrow_refund';
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ status: newStatus, updatedAt: now })
      .where(eq(tasks.id, task.id));

    await tx
      .update(assignments)
      .set({
        status: releaseToAgent ? 'completed' : 'refunded',
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(assignments.taskId, task.id));

    await tx.insert(transactions).values({
      taskId: task.id,
      type: txType,
      amount: BigInt(amount),
      txHash,
      chainId: env.CHAIN_ID,
      status: 'confirmed',
      confirmedAt: now,
    });
  });
}

async function handleTaskRefunded(
  data: Record<string, unknown>,
  txHash: string,
): Promise<void> {
  const onchainTaskId = String(data['taskId'] ?? '');
  const amount = String(data['amount'] ?? '0');
  const poster = String(data['poster'] ?? '');

  if (!onchainTaskId) return;

  const db = getDb();
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.onchainTaskId, onchainTaskId))
    .limit(1);

  if (!task) return;

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ status: 'refunded', updatedAt: now })
      .where(eq(tasks.id, task.id));

    await tx.insert(transactions).values({
      taskId: task.id,
      type: 'escrow_refund',
      amount: BigInt(amount),
      toAddress: poster || undefined,
      fromAddress: env.CONTRACT_TASK_ESCROW_ADDRESS ?? null,
      txHash,
      chainId: env.CHAIN_ID,
      status: 'confirmed',
      confirmedAt: now,
    });
  });
}

// ── Job processor ─────────────────────────────────────────────────────────────

async function processJob(job: Job<WebhookProcessJob>): Promise<void> {
  const { eventName, txHash, data } = job.data;

  switch (eventName) {
    case 'TaskCreated':
      await handleTaskCreated(data, txHash);
      break;
    case 'AgentAssigned':
      await handleAgentAssigned(data);
      break;
    case 'WorkSubmitted':
      await handleWorkSubmitted(data);
      break;
    case 'WorkAccepted':
      await handleWorkAccepted(data, txHash);
      break;
    case 'TaskDisputed':
      await handleTaskDisputed(data);
      break;
    case 'DisputeResolved':
      await handleDisputeResolved(data, txHash);
      break;
    case 'TaskRefunded':
      await handleTaskRefunded(data, txHash);
      break;
    default:
      // Unknown event — log and skip without throwing (no retry needed)
      process.stderr.write(`[webhook.process] Unknown event: ${eventName}\n`);
  }

  // Mark the webhooks_inbox row as processed (best effort — row may not exist for all events)
  try {
    const db = getDb();
    await db
      .update(webhooksInbox)
      .set({ status: 'processed', processedAt: new Date() })
      .where(
        and(
          eq(webhooksInbox.eventType, eventName),
          eq(webhooksInbox.status, 'processing'),
        ),
      );
  } catch {
    // Non-fatal
  }
}

export function createWebhookProcessWorker() {
  const worker = new Worker<WebhookProcessJob>(
    QUEUE_NAMES.WEBHOOK_PROCESS,
    processJob,
    {
      connection: getBullmqRedis(),
      concurrency: env.WEBHOOK_PROCESS_CONCURRENCY,
    },
  );

  worker.on('failed', (job, err) => {
    process.stderr.write(
      `[${WORKER_NAME}] job ${job?.id ?? '?'} failed (attempt ${job?.attemptsMade ?? '?'}): ${err.message}\n`,
    );
  });

  return worker;
}
