// @agentbay/contracts — public API
// viem v2, Zod 3.x
// Exports: ABIs, typed viem clients, Zod event schemas, chain constants.

// ── ABIs ──────────────────────────────────────────────────────────────────────
export { agentRegistryAbi } from './abis/agentRegistry.js';
export type { AgentRegistryAbi } from './abis/agentRegistry.js';

export { reputationRegistryAbi } from './abis/reputationRegistry.js';
export type { ReputationRegistryAbi } from './abis/reputationRegistry.js';

export { taskEscrowAbi, TaskStatus } from './abis/taskEscrow.js';
export type { TaskEscrowAbi, TaskStatusValue } from './abis/taskEscrow.js';

// ── viem client factories ─────────────────────────────────────────────────────
export { getAgentRegistryClient } from './clients/agentRegistry.js';
export type { AgentRegistryClient } from './clients/agentRegistry.js';

export { getReputationRegistryClient } from './clients/reputationRegistry.js';
export type { ReputationRegistryClient } from './clients/reputationRegistry.js';

export { getTaskEscrowClient } from './clients/taskEscrow.js';
export type { TaskEscrowClient } from './clients/taskEscrow.js';

// ── Zod event payload schemas ─────────────────────────────────────────────────
// Used by apps/api to validate and type decoded contract event logs.
import { z } from 'zod';

const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid address');
const bytes32Schema = z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid bytes32');
const bigintSchema = z.bigint();

// AgentRegistry events
export const AgentRegisteredSchema = z.object({
  agentId: bigintSchema,
  owner: addressSchema,
  metadataURI: z.string().min(1),
});

export const AgentUpdatedSchema = z.object({
  agentId: bigintSchema,
  metadataURI: z.string().min(1),
  capabilities: z.array(z.string()),
});

export const AgentDeactivatedSchema = z.object({
  agentId: bigintSchema,
});

export const AgentReactivatedSchema = z.object({
  agentId: bigintSchema,
});

// ReputationRegistry events
export const ReviewAddedSchema = z.object({
  agentId: bigintSchema,
  taskId: bigintSchema,
  rating: z.number().int().min(1).max(5),
  hashOfReview: bytes32Schema,
  reviewer: addressSchema,
});

// TaskEscrow events
export const TaskCreatedSchema = z.object({
  taskId: bigintSchema,
  poster: addressSchema,
  taskHash: bytes32Schema,
  amount: bigintSchema,
});

export const AgentAssignedSchema = z.object({
  taskId: bigintSchema,
  agentId: bigintSchema,
  agentWallet: addressSchema,
});

export const WorkSubmittedSchema = z.object({
  taskId: bigintSchema,
  resultHash: bytes32Schema,
});

export const WorkAcceptedSchema = z.object({
  taskId: bigintSchema,
  poster: addressSchema,
  agentWallet: addressSchema,
  amount: bigintSchema,
});

export const TaskDisputedSchema = z.object({
  taskId: bigintSchema,
  poster: addressSchema,
});

export const DisputeResolvedSchema = z.object({
  taskId: bigintSchema,
  winner: addressSchema,
  amount: bigintSchema,
});

export const TaskRefundedSchema = z.object({
  taskId: bigintSchema,
  poster: addressSchema,
  amount: bigintSchema,
});

export type AgentRegisteredEvent = z.infer<typeof AgentRegisteredSchema>;
export type AgentUpdatedEvent = z.infer<typeof AgentUpdatedSchema>;
export type ReviewAddedEvent = z.infer<typeof ReviewAddedSchema>;
export type TaskCreatedEvent = z.infer<typeof TaskCreatedSchema>;
export type AgentAssignedEvent = z.infer<typeof AgentAssignedSchema>;
export type WorkSubmittedEvent = z.infer<typeof WorkSubmittedSchema>;
export type WorkAcceptedEvent = z.infer<typeof WorkAcceptedSchema>;
export type TaskDisputedEvent = z.infer<typeof TaskDisputedSchema>;
export type DisputeResolvedEvent = z.infer<typeof DisputeResolvedSchema>;
export type TaskRefundedEvent = z.infer<typeof TaskRefundedSchema>;

// ── Chain constants ───────────────────────────────────────────────────────────

export const SUPPORTED_CHAIN_IDS = [84532, 8453] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export const USDC_ADDRESSES = {
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // Base Mainnet
} as const satisfies Record<SupportedChainId, `0x${string}`>;

export const CHAIN_NAMES = {
  84532: 'base-sepolia',
  8453: 'base',
} as const satisfies Record<SupportedChainId, string>;

export const BLOCK_EXPLORERS = {
  84532: 'https://sepolia.basescan.org',
  8453: 'https://basescan.org',
} as const satisfies Record<SupportedChainId, string>;

export function getUsdcAddress(chainId: SupportedChainId): `0x${string}` {
  return USDC_ADDRESSES[chainId];
}

export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}
