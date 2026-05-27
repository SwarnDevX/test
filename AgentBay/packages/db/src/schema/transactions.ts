import { relations } from 'drizzle-orm';
import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { tasks } from './tasks.js';

export const transactionTypeEnum = pgEnum('transaction_type', [
  'escrow_deposit',
  'escrow_release',
  'escrow_refund',
  'x402_payment',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'confirmed',
  'failed',
]);

export const transactions = pgTable(
  'transactions',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'restrict' }),
    type: transactionTypeEnum('type').notNull(),
    // Amount in USDC 6-decimal units
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    fromAddress: text('from_address'),
    toAddress: text('to_address'),
    txHash: text('tx_hash'),
    chainId: integer('chain_id'),
    status: transactionStatusEnum('status').notNull().default('pending'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('transactions_task_id_idx').on(t.taskId),
    index('transactions_tx_hash_idx').on(t.txHash),
    index('transactions_status_idx').on(t.status),
    index('transactions_created_at_idx').on(t.createdAt),
  ],
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  task: one(tasks, { fields: [transactions.taskId], references: [tasks.id] }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
