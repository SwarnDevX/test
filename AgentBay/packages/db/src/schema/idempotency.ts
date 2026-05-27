import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

// Idempotency key store. Prevents double-processing of payment/mutation requests.
// The API checks this before processing and writes the response after success.
// TTL is enforced via expiresAt; a cron job or DB rule can prune expired rows.
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    // The client-supplied key from the Idempotency-Key header
    key: text('key').notNull(),
    // Owner scope — same key from different users is independent
    userId: text('user_id').notNull(),
    requestPath: text('request_path').notNull(),
    // SHA-256 of request body to detect mismatched replays
    requestHash: text('request_hash').notNull(),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    // locked_at is set when request starts; cleared when complete — detects in-progress
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('idempotency_keys_user_key_unique').on(t.userId, t.key),
    index('idempotency_keys_expires_at_idx').on(t.expiresAt),
  ],
);

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type NewIdempotencyKey = typeof idempotencyKeys.$inferInsert;
