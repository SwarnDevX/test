// task.settle worker — finalises a task after the poster accepts the work onchain.
// Updates assignment + task to 'completed' and records a confirmed transaction.
import { Worker, type Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { getDb, tasks, assignments, transactions } from '@agentbay/db';
import { QUEUE_NAMES, type TaskSettleJob } from '@agentbay/shared';
import { getBullmqRedis } from '../config/redis.js';
import { env } from '../config/env.js';

const WORKER_NAME = 'task.settle';

async function processJob(job: Job<TaskSettleJob>): Promise<void> {
  const { taskId, txHash, amountUsdc, agentWallet } = job.data;
  const db = getDb();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) throw new Error(`Task ${taskId} not found`);

  // Idempotency: already settled
  if (task.status === 'completed') {
    return;
  }

  if (task.status !== 'reviewing' && task.status !== 'submitted') {
    throw new Error(`Task ${taskId} cannot be settled from status: ${task.status}`);
  }

  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ status: 'completed', updatedAt: now })
      .where(eq(tasks.id, taskId));

    await tx
      .update(assignments)
      .set({ status: 'completed', completedAt: now, updatedAt: now })
      .where(eq(assignments.taskId, taskId));

    if (txHash && amountUsdc) {
      await tx.insert(transactions).values({
        taskId,
        type: 'escrow_release',
        amount: BigInt(amountUsdc),
        fromAddress: task.onchainTaskId ? env.CONTRACT_TASK_ESCROW_ADDRESS ?? null : null,
        toAddress: agentWallet ?? null,
        txHash,
        chainId: env.CHAIN_ID,
        status: 'confirmed',
        confirmedAt: now,
      });
    }
  });
}

export function createTaskSettleWorker() {
  const worker = new Worker<TaskSettleJob>(
    QUEUE_NAMES.TASK_SETTLE,
    processJob,
    {
      connection: getBullmqRedis(),
      concurrency: env.TASK_SETTLE_CONCURRENCY,
    },
  );

  worker.on('failed', (job, err) => {
    process.stderr.write(
      `[${WORKER_NAME}] job ${job?.id ?? '?'} failed (attempt ${job?.attemptsMade ?? '?'}): ${err.message}\n`,
    );
  });

  return worker;
}
