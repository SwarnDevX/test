import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users.js';
import { agents } from './agents.js';
import { tasks } from './tasks.js';

export const reviews = pgTable(
  'reviews',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'restrict' }),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'restrict' }),
    reviewerId: text('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // 1–5 star rating
    rating: integer('rating').notNull(),
    reviewText: text('review_text'),
    // keccak256 hash of review text stored off-chain / in ReputationRegistry
    onchainHash: text('onchain_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('reviews_task_id_unique').on(t.taskId),
    index('reviews_agent_id_idx').on(t.agentId),
    index('reviews_reviewer_id_idx').on(t.reviewerId),
    index('reviews_created_at_idx').on(t.createdAt),
  ],
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  task: one(tasks, { fields: [reviews.taskId], references: [tasks.id] }),
  agent: one(agents, { fields: [reviews.agentId], references: [agents.id] }),
  reviewer: one(users, { fields: [reviews.reviewerId], references: [users.id] }),
}));

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
