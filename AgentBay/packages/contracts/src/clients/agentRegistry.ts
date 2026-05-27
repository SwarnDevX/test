// viem v2 — getContract creates a type-safe contract instance bound to a client.
import { getContract } from 'viem';
import type { Address, Client } from 'viem';
import { agentRegistryAbi } from '../abis/agentRegistry.js';

export function getAgentRegistryClient(config: { address: Address; client: Client }) {
  return getContract({
    address: config.address,
    abi: agentRegistryAbi,
    client: config.client,
  });
}

export type AgentRegistryClient = ReturnType<typeof getAgentRegistryClient>;
export { agentRegistryAbi };
