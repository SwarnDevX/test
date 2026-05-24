import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core'

// ── Enums ──────────────────────────────────────────────────────────────────

export const planEnum = pgEnum('plan', [
  'trial',
  'solo',
  'brokerage',
  'agency',
  'canceled',
])

export const roleEnum = pgEnum('role', [
  'owner',
  'admin',
  'dispatcher',
  'viewer',
])

// ── Brokerages (tenants) ───────────────────────────────────────────────────

export const brokerages = pgTable('brokerages', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: text('clerk_org_id').notNull().unique(),
  name: text('name').notNull(),
  mcNumber: text('mc_number'),
  plan: planEnum('plan').notNull().default('trial'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  brokerageId: uuid('brokerage_id').references(() => brokerages.id, {
    onDelete: 'cascade',
  }),
  email: text('email').notNull(),
  fullName: text('full_name'),
  role: roleEnum('role').notNull().default('viewer'),
  phoneForSms: text('phone_for_sms'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Types ──────────────────────────────────────────────────────────────────

export type Brokerage = typeof brokerages.$inferSelect
export type NewBrokerage = typeof brokerages.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
