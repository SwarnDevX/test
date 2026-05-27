// Redis pub/sub subscriber — relays worker stream events to Socket.IO rooms.
// Pattern: task:{taskId}:stream → socket room 'task:{taskId}'
import type { Server } from 'socket.io';
import { getSubRedis } from '../config/redis.js';

// Channel pattern published by apps/worker/src/lib/realtime.ts
const CHANNEL_PATTERN = 'task:*:stream';

// Extract taskId from channel name 'task:{taskId}:stream'
function extractTaskId(channel: string): string | null {
  const match = /^task:(.+):stream$/.exec(channel);
  return match?.[1] ?? null;
}

export async function startSubscriber(io: Server): Promise<() => Promise<void>> {
  const redis = getSubRedis();

  await redis.psubscribe(CHANNEL_PATTERN, (err) => {
    if (err) {
      process.stderr.write(`[subscriber] psubscribe error: ${err.message}\n`);
    }
  });

  redis.on('pmessage', (_pattern: string, channel: string, message: string) => {
    const taskId = extractTaskId(channel);
    if (!taskId) return;

    let event: unknown;
    try {
      event = JSON.parse(message);
    } catch {
      return; // malformed message — drop silently
    }

    const room = `task:${taskId}`;

    if (isTaskComplete(event)) {
      io.to(room).emit('task:complete', event);
    } else if (isTaskError(event)) {
      io.to(room).emit('task:error', event);
    } else if (isStepFinish(event)) {
      io.to(room).emit('task:step-finish', event);
    } else {
      io.to(room).emit('task:stream', event);
    }
  });

  process.stdout.write(`[subscriber] Subscribed to pattern: ${CHANNEL_PATTERN}\n`);

  return async () => {
    await redis.punsubscribe(CHANNEL_PATTERN);
  };
}

// ── Type guards for worker-published event shapes ──────────────────────────────

function isTaskComplete(e: unknown): e is { type: 'task-complete' } {
  return typeof e === 'object' && e !== null && (e as Record<string, unknown>)['type'] === 'task-complete';
}

function isTaskError(e: unknown): e is { type: 'task-error' } {
  return typeof e === 'object' && e !== null && (e as Record<string, unknown>)['type'] === 'task-error';
}

function isStepFinish(e: unknown): e is { type: 'step-finish' } {
  return typeof e === 'object' && e !== null && (e as Record<string, unknown>)['type'] === 'step-finish';
}
