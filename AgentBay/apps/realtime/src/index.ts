// AgentBay realtime service — Socket.IO server with Redis pub/sub bridge.
// Clients connect with a short-lived JWT (issued by apps/api) and subscribe to task rooms.
// Workers publish stream events to Redis; this service relays them to connected browsers.
import { initSentry, initTracing } from '@agentbay/observability';
initSentry({ service: 'realtime', dsn: process.env['SENTRY_DSN'] });
initTracing('agentbay-realtime');

import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { getMainRedis, getSubRedis, closeAllRedis } from './config/redis.js';
import { env } from './config/env.js';
import { registerAuthMiddleware, getSocketData } from './lib/auth.js';
import { startSubscriber } from './lib/subscriber.js';

// ── HTTP server ───────────────────────────────────────────────────────────────

const httpServer = createServer((_req, res) => {
  // Health check — used by Railway/Docker health probes
  if (_req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }
  res.writeHead(404).end();
});

// ── Socket.IO server ──────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  // CORS: in production restrict to the web app origin
  cors: {
    origin: process.env['NEXT_PUBLIC_APP_URL'] ?? '*',
    credentials: true,
  },
  // Built-in heartbeat
  pingTimeout: 20_000,
  pingInterval: 25_000,
  // Don't buffer unbuffered events if client is offline (no replay needed — workers re-stream)
  connectionStateRecovery: {
    maxDisconnectionDuration: 30_000,
    skipMiddlewares: false,
  },
});

// Redis adapter enables horizontal scaling (multiple realtime instances share rooms)
const pubClient = getMainRedis();
const subClient = getSubRedis();
io.adapter(createAdapter(pubClient, subClient));

// ── Auth middleware ───────────────────────────────────────────────────────────

registerAuthMiddleware(io);

// ── Connection handler ────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  let socketData: ReturnType<typeof getSocketData>;
  try {
    socketData = getSocketData(socket);
  } catch {
    socket.disconnect(true);
    return;
  }

  const { userId, taskId, isAdmin } = socketData;
  const room = `task:${taskId}`;

  // Join the task room immediately after connecting
  void socket.join(room);

  if (env.NODE_ENV !== 'production') {
    process.stdout.write(
      `[socket] ${socket.id} connected (user=${userId}, task=${taskId}, admin=${String(isAdmin)})\n`,
    );
  }

  // Client requests to subscribe to a specific task.
  // The token already restricts which task they can access, so we just validate it matches.
  socket.on('subscribe', (requestedTaskId: unknown, ack: (response: { ok: boolean; error?: string }) => void) => {
    if (typeof requestedTaskId !== 'string' || requestedTaskId !== taskId) {
      if (typeof ack === 'function') {
        ack({ ok: false, error: 'You are not authorised to subscribe to that task' });
      }
      return;
    }
    if (typeof ack === 'function') {
      ack({ ok: true });
    }
  });

  socket.on('disconnect', (reason) => {
    if (env.NODE_ENV !== 'production') {
      process.stdout.write(`[socket] ${socket.id} disconnected (reason=${reason})\n`);
    }
  });
});

// ── Start subscriber bridge ──────────────────────────────────────────────────

let stopSubscriber: (() => Promise<void>) | null = null;

async function start(): Promise<void> {
  stopSubscriber = await startSubscriber(io);

  httpServer.listen(env.PORT, () => {
    process.stdout.write(
      `[realtime] Socket.IO server listening on http://localhost:${env.PORT.toString()}\n`,
    );
  });
}

// ── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  process.stdout.write(`[realtime] ${signal} received — shutting down\n`);

  await stopSubscriber?.();

  io.close(() => {
    process.stdout.write('[realtime] Socket.IO closed.\n');
  });

  await closeAllRedis();

  process.stdout.write('[realtime] Shutdown complete.\n');
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

start().catch((err: unknown) => {
  process.stderr.write(`[realtime] Fatal startup error: ${String(err)}\n`);
  process.exit(1);
});
