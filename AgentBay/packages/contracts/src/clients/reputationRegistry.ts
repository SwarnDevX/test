// viem v2 — getContract creates a type-safe contract instance bound to a client.
import { getContract } from 'viem';
import type { Address, Client } from 'viem';
import { reputationRegistryAbi } from '../abis/reputationRegistry.js';

export function getReputationRegistryClient(config: { address: Address; client: Client }) {
  return getContract({
    address: config.address,
    abi: reputationRegistryAbi,
    client: config.client,
  });
}

export type ReputationRegistryClient = ReturnType<typeof getReputationRegistryClient>;
export { reputationRegistryAbi };
