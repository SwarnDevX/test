import { Queue } from 'bullmq';
import { redis } from '@/lib/redis';

let _aiQueue: Queue | null = null;
let _exportQueue: Queue | null = null;
let _emailQueue: Queue | null = null;

const queueDefaults = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential' as const, delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
};

export function getAiQueue(): Queue {
  if (!_aiQueue) _aiQueue = new Queue('ai-jobs', { connection: redis, ...queueDefaults });
  return _aiQueue;
}

export function getExportQueue(): Queue {
  if (!_exportQueue) _exportQueue = new Queue('export-jobs', { connection: redis, ...queueDefaults });
  return _exportQueue;
}

export function getEmailQueue(): Queue {
  if (!_emailQueue) _emailQueue = new Queue('email-jobs', { connection: redis, ...queueDefaults });
  return _emailQueue;
}

// Backward-compat exports (lazy wrappers)
export const aiQueue = {
  add: (name: string, data: unknown, opts?: unknown) =>
    getAiQueue().add(name, data as any, opts as any),
};
export const exportQueue = {
  add: (name: string, data: unknown, opts?: unknown) =>
    getExportQueue().add(name, data as any, opts as any),
};

