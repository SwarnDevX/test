// AgentBay worker service — starts all BullMQ workers and wires up graceful shutdown.
import { initSentry, initTracing } from '@agentbay/observability';
initSentry({ service: 'worker', dsn: process.env['SENTRY_DSN'] });
initTracing('agentbay-worker');

import { closeDb } from '@agentbay/db';
import { getDlqQueue, closeAllQueues } from './queues/index.js';
import { closeAllRedis } from './config/redis.js';
import { createTaskExecuteWorker } from './workers/taskExecute.js';
import { createTaskSettleWorker } from './workers/taskSettle.js';
import { createWebhookProcessWorker } from './workers/webhookProcess.js';
import { QUEUE_NAMES, type DlqJob } from '@agentbay/shared';
import { Worker, type Job } from 'bullmq';
import { getBullmqRedis } from './config/redis.js';
import { env } from './config/env.js';

// ── DLQ worker ────────────────────────────────────────────────────────────────
// Logs permanently failed jobs; extend here to send alerts in production.
function createDlqWorker(): Worker<DlqJob> {
  return new Worker<DlqJob>(
    QUEUE_NAMES.DLQ,
    async (job: Job<DlqJob>) => {
      const { originQueue, originJobId, failedReason, data } = job.data;
      process.stderr.write(
        `[dlq] Permanently failed job from ${originQueue} (id=${originJobId}): ${failedReason}\n` +
          `      data=${JSON.stringify(data)}\n`,
      );
    },
    { connection: getBullmqRedis(), concurrency: 1 },
  );
}

// ── DLQ forwarding — attach to each worker ───────────────────────────────────
function attachDlqForwarding(worker: Worker, queueName: string): void {
  worker.on('failed', async (job, err) => {
    if (!job) return;
    // Only forward when all retries are exhausted
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade < maxAttempts) return;

    try {
      await getDlqQueue().add(QUEUE_NAMES.DLQ, {
        originQueue: queueName,
        originJobId: job.id ?? '',
        originJobName: job.name,
        failedReason: err.message,
        attemptsMade: job.attemptsMade,
        data: job.data,
      });
    } catch (dlqErr) {
      process.stderr.write(`[dlq] Failed to enqueue DLQ entry: ${String(dlqErr)}\n`);
    }
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  process.stdout.write(
    `[worker] Starting AgentBay worker service (env=${env.NODE_ENV}, chain=${env.CHAIN_ID})\n`,
  );

  const taskExecuteWorker = createTaskExecuteWorker();
  const taskSettleWorker = createTaskSettleWorker();
  const webhookProcessWorker = createWebhookProcessWorker();
  const dlqWorker = createDlqWorker();

  attachDlqForwarding(taskExecuteWorker, QUEUE_NAMES.TASK_EXECUTE);
  attachDlqForwarding(taskSettleWorker, QUEUE_NAMES.TASK_SETTLE);
  attachDlqForwarding(webhookProcessWorker, QUEUE_NAMES.WEBHOOK_PROCESS);

  process.stdout.write('[worker] All workers running.\n');

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  async function shutdown(signal: string): Promise<void> {
    process.stdout.write(`[worker] ${signal} received — shutting down gracefully\n`);

    await Promise.allSettled([
      taskExecuteWorker.close(),
      taskSettleWorker.close(),
      webhookProcessWorker.close(),
      dlqWorker.close(),
    ]);

    await closeAllQueues();
    await closeAllRedis();
    await closeDb();

    process.stdout.write('[worker] Shutdown complete.\n');
    process.exit(0);
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err: unknown) => {
  process.stderr.write(`[worker] Fatal startup error: ${String(err)}\n`);
  process.exit(1);
});
