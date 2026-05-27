// viem v2 — getContract creates a type-safe contract instance bound to a client.
import { getContract } from 'viem';
import type { Address, Client } from 'viem';
import { taskEscrowAbi } from '../abis/taskEscrow.js';

export function getTaskEscrowClient(config: { address: Address; client: Client }) {
  return getContract({
    address: config.address,
    abi: taskEscrowAbi,
    client: config.client,
  });
}

export type TaskEscrowClient = ReturnType<typeof getTaskEscrowClient>;
export { taskEscrowAbi };
