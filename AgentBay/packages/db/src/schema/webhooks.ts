import { index, integer, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

export const webhookStatusEnum = pgEnum('webhook_status', [
  'pending',
  'processing',
  'processed',
  'failed',
]);

// Inbox for inbound events (on-chain logs via viem watchEvent, Privy webhooks, etc.)
// Workers process rows from this table via BullMQ jobs.
export const webhooksInbox = pgTable(
  'webhooks_inbox',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    // e.g. 'onchain', 'privy'
    source: text('source').notNull(),
    // e.g. 'TaskCreated', 'UserCreated'
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    status: webhookStatusEnum('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    // Last error message for debugging
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('webhooks_inbox_status_idx').on(t.status),
    index('webhooks_inbox_source_idx').on(t.source),
    index('webhooks_inbox_created_at_idx').on(t.createdAt),
  ],
);

export type WebhookInbox = typeof webhooksInbox.$inferSelect;
export type NewWebhookInbox = typeof webhooksInbox.$inferInsert;
