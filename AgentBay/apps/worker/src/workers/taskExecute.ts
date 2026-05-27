// task.execute worker — runs an agent against an assigned task.
// Streams output to Redis pub/sub, writes result to DB, submits work onchain.
import { Worker, type Job } from 'bullmq';
import { eq, asc } from 'drizzle-orm';
import { keccak256, toHex } from 'viem';
import { getDb, tasks, agents, assignments, messages } from '@agentbay/db';
import { AgentRuntime, SEED_AGENTS, type AgentConfig } from '@agentbay/agents';
import { QUEUE_NAMES, type TaskExecuteJob } from '@agentbay/shared';
import { getBullmqRedis } from '../config/redis.js';
import { submitWorkOnchain } from '../lib/onchain.js';
import { publishStreamEvent, publishTaskComplete, publishTaskError } from '../lib/realtime.js';
import { env } from '../config/env.js';

const WORKER_NAME = 'task.execute';

async function buildAgentConfig(agentDbId: string, seedAgentId?: string): Promise<AgentConfig> {
  if (seedAgentId) {
    const seed = SEED_AGENTS[seedAgentId];
    if (seed) return seed;
  }

  const db = getDb();
  const [agent] = await db.select().from(agents).where(eq(agents.id, agentDbId)).limit(1);
  if (!agent) throw new Error(`Agent ${agentDbId} not found`);

  // Fallback: build a minimal config from DB row using the researcher template
  const base = SEED_AGENTS['researcher'];
  if (!base) throw new Error('No seed agent config available as fallback');

  return {
    ...base,
    id: agent.id,
    name: agent.name,
    description: agent.description,
    capabilities: agent.capabilities,
  };
}

async function processJob(job: Job<TaskExecuteJob>): Promise<void> {
  const { taskId, assignmentId, agentId, seedAgentId } = job.data;
  const db = getDb();

  // ── Load task and assignment ─────────────────────────────────────────────
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);

  // Idempotency: already submitted
  if (assignment.status === 'submitted' || assignment.status === 'completed') {
    return;
  }

  if (assignment.status !== 'active') {
    throw new Error(`Assignment ${assignmentId} is in unexpected status: ${assignment.status}`);
  }

  // ── Load prior messages as conversation history ──────────────────────────
  const priorMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.taskId, taskId))
    .orderBy(asc(messages.createdAt));

  const conversationHistory = priorMessages.map((m) => ({
    role: m.role === 'agent' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }));

  // Always include the task description as the first user message if no history
  const inputMessages =
    conversationHistory.length > 0
      ? conversationHistory
      : [{ role: 'user' as const, content: `${task.title}\n\n${task.description}` }];

  // ── Build agent config and runtime ──────────────────────────────────────
  const config = await buildAgentConfig(agentId, seedAgentId);
  const runtime = new AgentRuntime(config);

  // ── Stream execution ─────────────────────────────────────────────────────
  let finalOutput = '';
  let streamError: Error | null = null;

  try {
    for await (const event of runtime.stream({
      taskId,
      messages: inputMessages,
      context: `Task budget: ${task.budgetUsdc.toString()} USDC (6-decimal). Task ID: ${taskId}.`,
    })) {
      await publishStreamEvent(taskId, event);

      if (event.type === 'finish') {
        finalOutput = event.output;
      }

      // Report progress to BullMQ so the job doesn't time out
      if (event.type === 'step-finish') {
        await job.updateProgress(event.stepIndex);
      }
    }
  } catch (err) {
    streamError = err instanceof Error ? err : new Error(String(err));
  }

  if (streamError) {
    await publishTaskError(taskId, streamError.message);
    throw streamError;
  }

  if (!finalOutput) throw new Error('Agent produced no output');

  // ── Persist result ────────────────────────────────────────────────────────
  const resultHash = keccak256(toHex(finalOutput));
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(assignments)
      .set({ status: 'submitted', submittedAt: now, updatedAt: now })
      .where(eq(assignments.id, assignmentId));

    await tx
      .update(tasks)
      .set({ status: 'submitted', resultHash, updatedAt: now })
      .where(eq(tasks.id, taskId));

    // Store agent output as a message
    await tx.insert(messages).values({
      taskId,
      agentId,
      role: 'agent',
      content: finalOutput,
      metadata: { resultHash },
    });
  });

  // ── Submit work onchain (best effort) ────────────────────────────────────
  if (task.onchainTaskId) {
    try {
      const txHash = await submitWorkOnchain({
        onchainTaskId: BigInt(task.onchainTaskId),
        resultHash,
      });
      if (txHash) {
        await db
          .update(tasks)
          .set({ updatedAt: new Date() })
          .where(eq(tasks.id, taskId));
      }
    } catch (err) {
      // Non-fatal: onchain submission failure should not fail the job.
      // The platform operator can re-submit manually.
      process.stderr.write(`[task.execute] submitWorkOnchain failed for task ${taskId}: ${String(err)}\n`);
    }
  }

  await publishTaskComplete(taskId, resultHash);
}

export function createTaskExecuteWorker() {
  const worker = new Worker<TaskExecuteJob>(
    QUEUE_NAMES.TASK_EXECUTE,
    processJob,
    {
      connection: getBullmqRedis(),
      concurrency: env.TASK_EXECUTE_CONCURRENCY,
    },
  );

  worker.on('failed', (job, err) => {
    process.stderr.write(
      `[${WORKER_NAME}] job ${job?.id ?? '?'} failed (attempt ${job?.attemptsMade ?? '?'}): ${err.message}\n`,
    );
  });

  return worker;
}
