import { createMiddleware } from 'hono/factory';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { AuthError, generateId } from '@agentbay/shared';

export interface SessionUser {
  id: string;
  walletAddress: string;
  isAdmin: boolean;
}

const COOKIE_NAME = 'agentbay_session';
const SESSION_PREFIX = 'session:';

// ── Session storage (Redis) ───────────────────────────────────────────────────

export async function createSession(user: SessionUser): Promise<string> {
  const sessionId = generateId();
  const redis = getRedis();
  await redis.set(
    `${SESSION_PREFIX}${sessionId}`,
    JSON.stringify(user),
    'EX',
    env.SESSION_TTL_SECONDS,
  );
  return sessionId;
}

export async function getSession(sessionId: string): Promise<SessionUser | null> {
  const redis = getRedis();
  const raw = await redis.get(`${SESSION_PREFIX}${sessionId}`);
  if (raw == null) return null;
  return JSON.parse(raw) as SessionUser;
}

export async function destroySession(sessionId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`${SESSION_PREFIX}${sessionId}`);
}

// ── Cookie signing (HMAC-SHA256) ──────────────────────────────────────────────
// Cookie value format: `{sessionId}.{hmac}`

function sign(sessionId: string): string {
  const hmac = createHmac('sha256', env.SESSION_SECRET).update(sessionId).digest('base64url');
  return `${sessionId}.${hmac}`;
}

function unsign(cookie: string): string | null {
  const dot = cookie.lastIndexOf('.');
  if (dot === -1) return null;
  const sessionId = cookie.slice(0, dot);
  const expected = sign(sessionId);
  try {
    const a = Buffer.from(cookie);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return sessionId;
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function makeSessionCookie(sessionId: string): string {
  const signed = sign(sessionId);
  const maxAge = env.SESSION_TTL_SECONDS;
  const domain = env.COOKIE_DOMAIN ? `; Domain=${env.COOKIE_DOMAIN}` : '';
  const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${signed}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Path=/${domain}${secure}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}

function extractSessionId(c: { req: { header(name: string): string | undefined } }): string | null {
  const cookieHeader = c.req.header('cookie');
  if (cookieHeader == null) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (match == null || match[1] == null) return null;
  return unsign(match[1]);
}

// ── Middleware ────────────────────────────────────────────────────────────────

// Reads the session cookie and populates c.get('user').
// Does NOT reject unauthenticated requests — use `requireAuth` for that.
export const sessionMiddleware = createMiddleware(async (c, next) => {
  const sessionId = extractSessionId(c);
  if (sessionId != null) {
    const user = await getSession(sessionId);
    c.set('user', user);
  } else {
    c.set('user', null);
  }
  await next();
});

// Reject the request if there is no authenticated session.
export const requireAuth = createMiddleware(async (c, next) => {
  const user = c.get('user') as SessionUser | null;
  if (user == null) throw new AuthError('Authentication required');
  await next();
});

// Reject if the user is not an admin.
export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get('user') as SessionUser | null;
  if (user == null || !user.isAdmin) throw new AuthError('Admin access required');
  await next();
});
