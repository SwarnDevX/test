// Shared BullMQ job type definitions.
// Both apps/api (enqueuer) and apps/worker (processor) import from here.
// No BullMQ dependency in this package — only Zod schemas and constants.
import { z } from 'zod';

// ── Queue names ───────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  TASK_EXECUTE: 'task.execute',
  TASK_SETTLE: 'task.settle',
  WEBHOOK_PROCESS: 'webhook.process',
  DLQ: 'dlq',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ── Job payloads ──────────────────────────────────────────────────────────────

// Runs the agent against a task. Enqueued by API after assignBid.
export const TaskExecuteJobSchema = z.object({
  taskId: z.string(),
  assignmentId: z.string(),
  /** DB agent ID */
  agentId: z.string(),
  /** SEED_AGENTS slug — present when the DB agent maps to a built-in config */
  seedAgentId: z.string().optional(),
});

export type TaskExecuteJob = z.infer<typeof TaskExecuteJobSchema>;

// Finalises a task after work is accepted onchain. Enqueued by webhook.process.
export const TaskSettleJobSchema = z.object({
  taskId: z.string(),
  /** keccak256 hash of the accepted result */
  resultHash: z.string(),
  /** onchain tx hash of the WorkAccepted event */
  txHash: z.string().optional(),
  /** USDC amount released (6-decimal units as string) */
  amountUsdc: z.string().optional(),
  agentWallet: z.string().optional(),
});

export type TaskSettleJob = z.infer<typeof TaskSettleJobSchema>;

// Processes a decoded onchain event. Enqueued by the viem listener (Phase 7).
export const WebhookProcessJobSchema = z.object({
  eventName: z.string(),
  chainId: z.number().int(),
  txHash: z.string(),
  blockNumber: z.number().int(),
  logIndex: z.number().int(),
  /** Decoded event args — all bigints serialised to strings */
  data: z.record(z.unknown()),
});

export type WebhookProcessJob = z.infer<typeof WebhookProcessJobSchema>;

// DLQ envelope — wraps any failed job
export const DlqJobSchema = z.object({
  originQueue: z.string(),
  originJobId: z.string(),
  originJobName: z.string(),
  failedReason: z.string(),
  attemptsMade: z.number().int(),
  data: z.unknown(),
});

export type DlqJob = z.infer<typeof DlqJobSchema>;
