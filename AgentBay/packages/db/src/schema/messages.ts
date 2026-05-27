import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users.js';
import { agents } from './agents.js';
import { tasks } from './tasks.js';

export const messageRoleEnum = pgEnum('message_role', ['user', 'agent', 'system']);

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    // Nullable: agent messages have no senderId; system messages have neither
    senderId: text('sender_id').references(() => users.id, { onDelete: 'set null' }),
    agentId: text('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('messages_task_id_idx').on(t.taskId),
    index('messages_created_at_idx').on(t.createdAt),
    index('messages_sender_id_idx').on(t.senderId),
  ],
);

export const messagesRelations = relations(messages, ({ one }) => ({
  task: one(tasks, { fields: [messages.taskId], references: [tasks.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  agent: one(agents, { fields: [messages.agentId], references: [agents.id] }),
}));

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
