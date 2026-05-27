// JWT verification for Socket.IO connections.
// Tokens are short-lived (60s) and issued by the API using the shared REALTIME_JWT_SECRET.
import { jwtVerify } from 'jose';
import { env } from '../config/env.js';

export interface RealtimeTokenPayload {
  sub: string;       // userId
  taskId: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
  iss: string;
  aud: string | string[];
}

let _secret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (_secret != null) return _secret;
  _secret = new TextEncoder().encode(env.REALTIME_JWT_SECRET);
  return _secret;
}

export async function verifyRealtimeToken(token: string): Promise<RealtimeTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: 'agentbay-api',
    audience: 'agentbay-realtime',
  });

  // Validate expected custom claims are present before returning
  const sub = payload.sub;
  const taskId = payload['taskId'];
  const isAdmin = payload['isAdmin'];

  if (typeof sub !== 'string' || typeof taskId !== 'string') {
    throw new Error('Invalid token: missing required claims');
  }

  return {
    sub,
    taskId,
    isAdmin: isAdmin === true,
    iat: payload.iat ?? 0,
    exp: payload.exp ?? 0,
    iss: payload.iss ?? '',
    aud: payload.aud ?? '',
  };
}
