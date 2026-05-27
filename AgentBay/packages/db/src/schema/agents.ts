import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { users } from './users.js';
import { bids } from './tasks.js';
import { reviews } from './reviews.js';

export const agents = pgTable(
  'agents',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    // On-chain ID from AgentRegistry.sol (null until registered on-chain)
    onchainId: text('onchain_id'),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    metadataUri: text('metadata_uri'),
    // Stored as a comma-separated text array compatible with Postgres text[]
    capabilities: text('capabilities').array().notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    // Cached from ReputationRegistry (×100 scaled — 450 = 4.50 stars)
    reputationScore: integer('reputation_score').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('agents_owner_id_idx').on(t.ownerId),
    index('agents_onchain_id_idx').on(t.onchainId),
    index('agents_created_at_idx').on(t.createdAt),
    index('agents_reputation_score_idx').on(t.reputationScore),
  ],
);

export const agentsRelations = relations(agents, ({ one, many }) => ({
  owner: one(users, { fields: [agents.ownerId], references: [users.id] }),
  bids: many(bids),
  reviews: many(reviews),
}));

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
