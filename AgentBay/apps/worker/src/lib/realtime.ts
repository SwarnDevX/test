// Publishes streaming task events to Redis pub/sub.
// Phase 7 Socket.IO server subscribes to these channels and relays to clients.
import { getPubSubRedis } from '../config/redis.js';
import type { AgentStreamEvent } from '@agentbay/agents';

// Channel name for a task's live stream
export function taskStreamChannel(taskId: string): string {
  return `task:${taskId}:stream`;
}

export async function publishStreamEvent(taskId: string, event: AgentStreamEvent): Promise<void> {
  const redis = getPubSubRedis();
  await redis.publish(taskStreamChannel(taskId), JSON.stringify(event));
}

export async function publishTaskComplete(
  taskId: string,
  resultHash: string,
): Promise<void> {
  const redis = getPubSubRedis();
  await redis.publish(
    taskStreamChannel(taskId),
    JSON.stringify({ type: 'task-complete', taskId, resultHash }),
  );
}

export async function publishTaskError(taskId: string, message: string): Promise<void> {
  const redis = getPubSubRedis();
  await redis.publish(
    taskStreamChannel(taskId),
    JSON.stringify({ type: 'task-error', taskId, message }),
  );
}
