import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { SiweMessage } from 'siwe';
import { getDb } from '@agentbay/db';
import { users } from '@agentbay/db';
import { eq } from 'drizzle-orm';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import {
  createSession,
  destroySession,
  makeSessionCookie,
  clearSessionCookie,
  requireAuth,
} from '../middleware/auth.js';
import { successResponse, AuthError, generateId } from '@agentbay/shared';
import type { SessionUser } from '../middleware/auth.js';

const auth = new Hono();

const NONCE_PREFIX = 'nonce:';

// ── POST /auth/nonce ──────────────────────────────────────────────────────────
// Generates a fresh nonce for the client to embed in a SIWE message.

auth.post('/nonce', async (c) => {
  const nonce = generateId();
  const redis = getRedis();
  await redis.set(`${NONCE_PREFIX}${nonce}`, '1', 'EX', env.NONCE_TTL_SECONDS);
  return c.json(successResponse({ nonce }));
});

// ── POST /auth/verify ─────────────────────────────────────────────────────────
// Verifies a signed SIWE message and creates a session.

const verifySchema = z.object({
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/),
});

auth.post('/verify', zValidator('json', verifySchema), async (c) => {
  const { message, signature } = c.req.valid('json');

  let siweMessage: SiweMessage;
  try {
    siweMessage = new SiweMessage(message);
  } catch {
    throw new AuthError('Invalid SIWE message format');
  }

  // Verify the nonce is one we issued and hasn't expired
  const redis = getRedis();
  const nonceKey = `${NONCE_PREFIX}${siweMessage.nonce}`;
  const nonceExists = await redis.get(nonceKey);
  if (nonceExists == null) {
    throw new AuthError('Nonce is invalid or expired');
  }

  // Verify the signature
  const { data, success } = await siweMessage.verify({
    signature,
    domain: env.SIWE_DOMAIN,
    nonce: siweMessage.nonce,
  });
  if (!success || data == null) {
    throw new AuthError('Signature verification failed');
  }

  // Consume the nonce — single use
  await redis.del(nonceKey);

  const walletAddress = data.address.toLowerCase();
  const db = getDb();

  // Upsert user — create on first login, update timestamp on return
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);

  if (user == null) {
    [user] = await db
      .insert(users)
      .values({ walletAddress })
      .returning();
  }

  if (user == null) throw new AuthError('Failed to create user');

  const sessionUser: SessionUser = {
    id: user.id,
    walletAddress: user.walletAddress,
    isAdmin: user.isAdmin,
  };
  const sessionId = await createSession(sessionUser);

  c.header('Set-Cookie', makeSessionCookie(sessionId));

  return c.json(
    successResponse({
      user: { id: user.id, walletAddress: user.walletAddress, isAdmin: user.isAdmin },
    }),
  );
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

auth.post('/logout', requireAuth, async (c) => {
  const cookieHeader = c.req.header('cookie') ?? '';
  const match = cookieHeader.match(/agentbay_session=([^;]+)/);
  if (match?.[1] != null) {
    // Extract session ID from signed cookie (best effort)
    const dot = match[1].lastIndexOf('.');
    if (dot !== -1) {
      await destroySession(match[1].slice(0, dot));
    }
  }
  c.header('Set-Cookie', clearSessionCookie());
  return c.json(successResponse({ loggedOut: true }));
});

// ── GET /auth/session ─────────────────────────────────────────────────────────

auth.get('/session', requireAuth, async (c) => {
  const user = c.get('user') as SessionUser;
  return c.json(successResponse({ user }));
});

export default auth;
