import { relations } from 'drizzle-orm';
import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users.js';
import { agents } from './agents.js';
import { messages } from './messages.js';
import { reviews } from './reviews.js';

export const taskStatusEnum = pgEnum('task_status', [
  'open',
  'assigned',
  'submitted',
  'reviewing',
  'completed',
  'disputed',
  'refunded',
  'cancelled',
]);

export const bidStatusEnum = pgEnum('bid_status', [
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
]);

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'active',
  'submitted',
  'completed',
  'disputed',
  'refunded',
]);

export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    posterId: text('poster_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    // USDC amount in 6-decimal token units — use bigint to avoid overflow
    budgetUsdc: bigint('budget_usdc', { mode: 'bigint' }).notNull(),
    status: taskStatusEnum('status').notNull().default('open'),
    // Set after createTask() is called on TaskEscrow.sol
    onchainTaskId: text('onchain_task_id'),
    onchainTaskHash: text('onchain_task_hash'),
    resultHash: text('result_hash'),
    tags: text('tags').array().notNull().default([]),
    deadline: timestamp('deadline', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('tasks_poster_id_idx').on(t.posterId),
    index('tasks_status_idx').on(t.status),
    index('tasks_created_at_idx').on(t.createdAt),
    index('tasks_onchain_task_id_idx').on(t.onchainTaskId),
  ],
);

export const bids = pgTable(
  'bids',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'restrict' }),
    priceUsdc: bigint('price_usdc', { mode: 'bigint' }).notNull(),
    etaHours: integer('eta_hours').notNull(),
    sampleOutput: text('sample_output'),
    coverNote: text('cover_note'),
    status: bidStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('bids_task_id_idx').on(t.taskId),
    index('bids_agent_id_idx').on(t.agentId),
    index('bids_status_idx').on(t.status),
    index('bids_created_at_idx').on(t.createdAt),
  ],
);

export const assignments = pgTable(
  'assignments',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    bidId: text('bid_id')
      .notNull()
      .references(() => bids.id, { onDelete: 'restrict' }),
    agentId: text('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'restrict' }),
    status: assignmentStatusEnum('status').notNull().default('active'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('assignments_task_id_unique').on(t.taskId),
    uniqueIndex('assignments_bid_id_unique').on(t.bidId),
    index('assignments_agent_id_idx').on(t.agentId),
    index('assignments_status_idx').on(t.status),
  ],
);

// ── Relations ─────────────────────────────────────────────────────────────────

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  poster: one(users, { fields: [tasks.posterId], references: [users.id] }),
  bids: many(bids),
  assignment: many(assignments),
  messages: many(messages),
  reviews: many(reviews),
}));

export const bidsRelations = relations(bids, ({ one }) => ({
  task: one(tasks, { fields: [bids.taskId], references: [tasks.id] }),
  agent: one(agents, { fields: [bids.agentId], references: [agents.id] }),
  assignment: one(assignments, { fields: [bids.id], references: [assignments.bidId] }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  task: one(tasks, { fields: [assignments.taskId], references: [tasks.id] }),
  bid: one(bids, { fields: [assignments.bidId], references: [bids.id] }),
  agent: one(agents, { fields: [assignments.agentId], references: [agents.id] }),
}));

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Bid = typeof bids.$inferSelect;
export type NewBid = typeof bids.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
