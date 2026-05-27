import { createMiddleware } from 'hono/factory';
import { getDb } from '@agentbay/db';
import { idempotencyKeys } from '@agentbay/db';
import { eq, and } from 'drizzle-orm';
import { hashString, ConflictError, ValidationError } from '@agentbay/shared';
import type { SessionUser } from './auth.js';

const KEY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Idempotency middleware — must run after auth so we know the userId.
// Checks the Idempotency-Key header and short-circuits with a cached response
// if the request was already completed. Rejects in-progress duplicates (409).
//
// Apply this middleware only to payment and mutation routes that opt in,
// not globally — reads and health checks do not need it.
export const idempotencyMiddleware = createMiddleware(async (c, next) => {
  const idempotencyKey = c.req.header('idempotency-key');
  if (idempotencyKey == null) return next();

  const user = c.get('user') as SessionUser | null;
  if (user == null) {
    throw new ValidationError('Idempotency-Key requires an authenticated user');
  }

  const db = getDb();

  const [existing] = await db
    .select()
    .from(idempotencyKeys)
    .where(and(eq(idempotencyKeys.key, idempotencyKey), eq(idempotencyKeys.userId, user.id)))
    .limit(1);

  if (existing != null) {
    // In-progress (lock held but not completed) — reject
    if (existing.completedAt == null) {
      throw new ConflictError('A request with this Idempotency-Key is already in progress');
    }
    // Completed — return cached response
    return c.json(existing.responseBody, (existing.responseStatus ?? 200) as Parameters<typeof c.json>[1]);
  }

  // Lock the key before processing
  const now = new Date();
  const expiresAt = new Date(now.getTime() + KEY_TTL_MS);

  await db.insert(idempotencyKeys).values({
    key: idempotencyKey,
    userId: user.id,
    requestPath: c.req.path,
    requestHash: hashString(await c.req.text()),
    lockedAt: now,
    expiresAt,
  });

  await next();

  // Persist the response so future replays get the same result
  if (c.res.ok) {
    try {
      const responseBody = await c.res.clone().json();
      await db
        .update(idempotencyKeys)
        .set({
          responseStatus: c.res.status,
          responseBody,
          completedAt: new Date(),
          lockedAt: null,
        })
        .where(and(eq(idempotencyKeys.key, idempotencyKey), eq(idempotencyKeys.userId, user.id)));
    } catch {
      // Non-JSON response — clear the lock so the caller can retry
      await db
        .update(idempotencyKeys)
        .set({ lockedAt: null })
        .where(and(eq(idempotencyKeys.key, idempotencyKey), eq(idempotencyKeys.userId, user.id)));
    }
  } else {
    // Failed response — clear the lock so the caller can retry
    await db
      .update(idempotencyKeys)
      .set({ lockedAt: null })
      .where(and(eq(idempotencyKeys.key, idempotencyKey), eq(idempotencyKeys.userId, user.id)));
  }
});
