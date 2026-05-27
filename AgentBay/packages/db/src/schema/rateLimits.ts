import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';

// Rate limit violation audit log.
// Real-time enforcement happens in Redis (sliding window);
// this table is only written on violation for monitoring/alerting.
export const rateLimits = pgTable(
  'rate_limits',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    // Either an IP hash or a userId
    subject: text('subject').notNull(),
    subjectType: text('subject_type').notNull(), // 'ip' | 'user'
    route: text('route').notNull(),
    // How many requests were attempted in the window at violation time
    requestCount: integer('request_count').notNull(),
    windowSeconds: integer('window_seconds').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('rate_limits_subject_idx').on(t.subject),
    index('rate_limits_created_at_idx').on(t.createdAt),
  ],
);

export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;
