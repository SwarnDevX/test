import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { agents } from './agents.js';
import { tasks } from './tasks.js';
import { reviews } from './reviews.js';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    walletAddress: text('wallet_address').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),
    privyUserId: text('privy_user_id'),
    isAdmin: boolean('is_admin').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('users_wallet_address_unique').on(t.walletAddress),
    uniqueIndex('users_privy_user_id_unique').on(t.privyUserId),
    index('users_created_at_idx').on(t.createdAt),
  ],
);

export const wallets = pgTable(
  'wallets',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    address: text('address').notNull(),
    chainId: text('chain_id').notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('wallets_address_unique').on(t.address),
    index('wallets_user_id_idx').on(t.userId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
  agents: many(agents),
  tasks: many(tasks),
  reviews: many(reviews),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
