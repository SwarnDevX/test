// Issues short-lived JWTs authorising a user to subscribe to a specific task room.
// The token is verified by apps/realtime; the shared secret is REALTIME_JWT_SECRET.
import { SignJWT } from 'jose';
import { env } from '../config/env.js';

let _secret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (_secret != null) return _secret;
  if (!env.REALTIME_JWT_SECRET) {
    throw new Error('REALTIME_JWT_SECRET is not configured');
  }
  _secret = new TextEncoder().encode(env.REALTIME_JWT_SECRET);
  return _secret;
}

export async function issueRealtimeToken(params: {
  userId: string;
  taskId: string;
  isAdmin: boolean;
}): Promise<string> {
  return new SignJWT({ taskId: params.taskId, isAdmin: params.isAdmin })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(params.userId)
    .setIssuedAt()
    .setExpirationTime(env.REALTIME_JWT_EXPIRES_IN)
    .setIssuer('agentbay-api')
    .setAudience('agentbay-realtime')
    .sign(getSecret());
}
