// BullMQ queue instances and typed job-add helpers.
// Only import this in workers and the API job-enqueue helper.
import { Queue } from 'bullmq';
import {
  QUEUE_NAMES,
  type TaskExecuteJob,
  type TaskSettleJob,
  type WebhookProcessJob,
  type DlqJob,
} from '@agentbay/shared';
import { getBullmqRedis } from '../config/redis.js';

// ── Queue instances (lazy-init) ───────────────────────────────────────────────

function makeQueue<T>(name: string) {
  return new Queue<T>(name, {
    connection: getBullmqRedis(),
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 1000 },
    },
  });
}

let _taskExecuteQueue: Queue<TaskExecuteJob> | null = null;
let _taskSettleQueue: Queue<TaskSettleJob> | null = null;
let _webhookProcessQueue: Queue<WebhookProcessJob> | null = null;
let _dlqQueue: Queue<DlqJob> | null = null;

export function getTaskExecuteQueue(): Queue<TaskExecuteJob> {
  return (_taskExecuteQueue ??= makeQueue<TaskExecuteJob>(QUEUE_NAMES.TASK_EXECUTE));
}

export function getTaskSettleQueue(): Queue<TaskSettleJob> {
  return (_taskSettleQueue ??= makeQueue<TaskSettleJob>(QUEUE_NAMES.TASK_SETTLE));
}

export function getWebhookProcessQueue(): Queue<WebhookProcessJob> {
  return (_webhookProcessQueue ??= makeQueue<WebhookProcessJob>(QUEUE_NAMES.WEBHOOK_PROCESS));
}

export function getDlqQueue(): Queue<DlqJob> {
  return (_dlqQueue ??= makeQueue<DlqJob>(QUEUE_NAMES.DLQ));
}

// ── Typed job-add helpers ─────────────────────────────────────────────────────

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
} as const;

/** Enqueue a task.execute job. Idempotent — deduplicates on assignmentId. */
export async function enqueueTaskExecute(data: TaskExecuteJob): Promise<void> {
  await getTaskExecuteQueue().add(QUEUE_NAMES.TASK_EXECUTE, data, {
    ...DEFAULT_JOB_OPTIONS,
    jobId: `task.execute:${data.assignmentId}`,
  });
}

/** Enqueue a task.settle job. Idempotent — deduplicates on taskId. */
export async function enqueueTaskSettle(data: TaskSettleJob): Promise<void> {
  await getTaskSettleQueue().add(QUEUE_NAMES.TASK_SETTLE, data, {
    ...DEFAULT_JOB_OPTIONS,
    jobId: `task.settle:${data.taskId}`,
  });
}

/** Enqueue a webhook.process job. Idempotent — deduplicates on txHash+logIndex. */
export async function enqueueWebhookProcess(data: WebhookProcessJob): Promise<void> {
  await getWebhookProcessQueue().add(QUEUE_NAMES.WEBHOOK_PROCESS, data, {
    ...DEFAULT_JOB_OPTIONS,
    jobId: `webhook:${data.txHash}:${data.logIndex.toString()}`,
  });
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([
    _taskExecuteQueue?.close(),
    _taskSettleQueue?.close(),
    _webhookProcessQueue?.close(),
    _dlqQueue?.close(),
  ]);
}
