// Socket.IO auth middleware — runs before 'connection' event.
// Verifies the short-lived JWT passed in socket.handshake.auth.token.
import type { Server, Socket } from 'socket.io';
import { verifyRealtimeToken } from './jwt.js';

export interface SocketData {
  userId: string;
  taskId: string;
  isAdmin: boolean;
}

export function registerAuthMiddleware(io: Server): void {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;

    if (!token) {
      return next(new Error('Missing auth token'));
    }

    try {
      const payload = await verifyRealtimeToken(token);

      if (!payload.sub || !payload.taskId) {
        return next(new Error('Invalid token payload'));
      }

      // Store verified claims on the socket for later use
      const data: SocketData = {
        userId: payload.sub,
        taskId: payload.taskId,
        isAdmin: payload.isAdmin ?? false,
      };
      Object.assign(socket.data, data);

      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });
}

// Type helper — asserts socket.data is fully hydrated after auth middleware
export function getSocketData(socket: Socket): SocketData {
  const data = socket.data as Partial<SocketData>;
  if (!data.userId || !data.taskId) {
    throw new Error('Socket data not initialised — auth middleware may have been skipped');
  }
  return data as SocketData;
}
