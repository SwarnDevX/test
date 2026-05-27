// Agent service — DB operations for agent registration and profile management.
// Onchain registration calldata is returned for the client to sign.
import { and, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { encodeFunctionData } from 'viem';
import type { Hex } from 'viem';
import { getDb, agents, reviews } from '@agentbay/db';
import type { Agent, Review } from '@agentbay/db';
import { NotFoundError, ForbiddenError } from '@agentbay/shared';
import { agentRegistryAbi } from '@agentbay/contracts';
import { env } from '../config/env.js';

// ── Serializers ────────────────────────────────────────────────────────────────

function serializeAgent(a: Agent) {
  return {
    id: a.id,
    ownerId: a.ownerId,
    onchainId: a.onchainId,
    name: a.name,
    description: a.description,
    metadataUri: a.metadataUri,
    capabilities: a.capabilities,
    isActive: a.isActive,
    reputationScore: a.reputationScore,
    reviewCount: a.reviewCount,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

function serializeReview(r: Review) {
  return {
    id: r.id,
    taskId: r.taskId,
    agentId: r.agentId,
    reviewerId: r.reviewerId,
    rating: r.rating,
    reviewText: r.reviewText,
    onchainHash: r.onchainHash,
    createdAt: r.createdAt.toISOString(),
  };
}

// ── Onchain calldata helpers ───────────────────────────────────────────────────

type OnchainCalldata = { contractAddress: string; calldata: Hex } | null;

function encodeRegisterAgent(metadataUri: string, capabilities: string[]): OnchainCalldata {
  if (!env.CONTRACT_AGENT_REGISTRY_ADDRESS) return null;
  return {
    contractAddress: env.CONTRACT_AGENT_REGISTRY_ADDRESS,
    calldata: encodeFunctionData({
      abi: agentRegistryAbi,
      functionName: 'register',
      args: [metadataUri, capabilities],
    }),
  };
}

function encodeUpdateAgent(onchainId: bigint, metadataUri: string, capabilities: string[]): OnchainCalldata {
  if (!env.CONTRACT_AGENT_REGISTRY_ADDRESS) return null;
  return {
    contractAddress: env.CONTRACT_AGENT_REGISTRY_ADDRESS,
    calldata: encodeFunctionData({
      abi: agentRegistryAbi,
      functionName: 'update',
      args: [onchainId, metadataUri, capabilities],
    }),
  };
}

// ── createAgent ────────────────────────────────────────────────────────────────

export interface CreateAgentInput {
  ownerId: string;
  name: string;
  description: string;
  metadataUri?: string;
  capabilities: string[];
}

export async function createAgent(input: CreateAgentInput) {
  const db = getDb();

  const [agent] = await db
    .insert(agents)
    .values({
      ownerId: input.ownerId,
      name: input.name,
      description: input.description,
      metadataUri: input.metadataUri ?? null,
      capabilities: input.capabilities,
      isActive: true,
    })
    .returning();

  if (!agent) throw new Error('Insert failed');

  const onchain = encodeRegisterAgent(input.metadataUri ?? '', input.capabilities);

  return { agent: serializeAgent(agent), onchain };
}

// ── listAgents ─────────────────────────────────────────────────────────────────

export async function listAgents(opts: {
  cursor?: string;
  limit: number;
  capability?: string;
  minRating?: number;
}) {
  const db = getDb();
  const { cursor, limit, capability, minRating } = opts;

  const rows = await db
    .select()
    .from(agents)
    .where(
      and(
        isNull(agents.deletedAt),
        eq(agents.isActive, true),
        cursor != null ? lt(agents.id, cursor) : undefined,
        capability != null ? sql`${agents.capabilities} @> ARRAY[${capability}]::text[]` : undefined,
        minRating != null ? gte(agents.reputationScore, minRating) : undefined,
      ),
    )
    .orderBy(desc(agents.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (data.at(-1)?.id ?? null) : null;

  return { data: data.map(serializeAgent), nextCursor };
}

// ── getAgentById ───────────────────────────────────────────────────────────────

export async function getAgentById(id: string) {
  const db = getDb();

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), isNull(agents.deletedAt)))
    .limit(1);

  if (!agent) throw new NotFoundError(`Agent ${id} not found`);

  // Fetch 10 most recent reviews
  const recentReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.agentId, id))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return {
    agent: serializeAgent(agent),
    reviews: recentReviews.map(serializeReview),
  };
}

// ── updateAgent ────────────────────────────────────────────────────────────────

export interface UpdateAgentInput {
  agentId: string;
  requesterId: string;
  name?: string;
  description?: string;
  metadataUri?: string;
  capabilities?: string[];
}

export async function updateAgent(input: UpdateAgentInput) {
  const db = getDb();
  const { agentId, requesterId } = input;

  const [agent] = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, agentId), isNull(agents.deletedAt)))
    .limit(1);

  if (!agent) throw new NotFoundError(`Agent ${agentId} not found`);
  if (agent.ownerId !== requesterId) throw new ForbiddenError('Only the agent owner can update it');

  const updates: Partial<typeof agents.$inferInsert> = { updatedAt: new Date() };
  if (input.name != null) updates.name = input.name;
  if (input.description != null) updates.description = input.description;
  if (input.metadataUri != null) updates.metadataUri = input.metadataUri;
  if (input.capabilities != null) updates.capabilities = input.capabilities;

  const [updated] = await db
    .update(agents)
    .set(updates)
    .where(eq(agents.id, agentId))
    .returning();

  if (!updated) throw new Error('Update failed');

  const effectiveUri = updated.metadataUri ?? '';
  const effectiveCaps = updated.capabilities;
  let onchain: OnchainCalldata = null;
  if (updated.onchainId != null) {
    onchain = encodeUpdateAgent(BigInt(updated.onchainId), effectiveUri, effectiveCaps);
  }

  return { agent: serializeAgent(updated), onchain };
}
