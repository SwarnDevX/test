// Thin wrapper over BullMQ queues for use inside the API process.
// The API only enqueues jobs — it never processes them.
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import {
  QUEUE_NAMES,
  type TaskExecuteJob,
  type TaskSettleJob,
} from '@agentbay/shared';
import { env } from '../config/env.js';

// ── Redis connection ───────────────────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis {
  if (_redis != null) return _redis;
  _redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });
  _redis.on('error', (err: Error) => {
    process.stderr.write(`[api:jobQueue] Redis error: ${err.message}\n`);
  });
  return _redis;
}

// ── Queue singletons ──────────────────────────────────────────────────────────

let _taskExecuteQueue: Queue<TaskExecuteJob> | null = null;
let _taskSettleQueue: Queue<TaskSettleJob> | null = null;

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
} as const;

function getTaskExecuteQueue(): Queue<TaskExecuteJob> {
  return (_taskExecuteQueue ??= new Queue<TaskExecuteJob>(QUEUE_NAMES.TASK_EXECUTE, {
    connection: getRedis(),
    defaultJobOptions: { removeOnComplete: { count: 500 }, removeOnFail: { count: 1000 } },
  }));
}

function getTaskSettleQueue(): Queue<TaskSettleJob> {
  return (_taskSettleQueue ??= new Queue<TaskSettleJob>(QUEUE_NAMES.TASK_SETTLE, {
    connection: getRedis(),
    defaultJobOptions: { removeOnComplete: { count: 500 }, removeOnFail: { count: 1000 } },
  }));
}

// ── Public helpers ────────────────────────────────────────────────────────────

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
