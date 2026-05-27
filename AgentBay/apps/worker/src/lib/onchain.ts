// Operator wallet client — used by workers to call TaskEscrow on behalf of the platform.
// Only available when OPERATOR_PRIVATE_KEY is set. All public functions return null if unconfigured.
import {
  createWalletClient,
  createPublicClient,
  http,
  privateKeyToAccount,
  type WalletClient,
  type PublicClient,
  type Account,
  type Hex,
} from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { taskEscrowAbi } from '@agentbay/contracts';
import { env } from '../config/env.js';

// ── Chain selection ────────────────────────────────────────────────────────────

function getChain() {
  return env.CHAIN_ID === 8453 ? base : baseSepolia;
}

function getRpcUrl() {
  return env.CHAIN_ID === 8453
    ? (env.BASE_MAINNET_RPC_URL ?? env.BASE_SEPOLIA_RPC_URL)
    : env.BASE_SEPOLIA_RPC_URL;
}

// ── Singleton clients ─────────────────────────────────────────────────────────

let _wallet: WalletClient | null = null;
let _public: PublicClient | null = null;
let _account: Account | null = null;

export function getOperatorAccount(): Account | null {
  if (_account != null) return _account;
  if (!env.OPERATOR_PRIVATE_KEY) return null;
  _account = privateKeyToAccount(env.OPERATOR_PRIVATE_KEY as `0x${string}`);
  return _account;
}

export function getWalletClient(): WalletClient | null {
  const account = getOperatorAccount();
  if (!account) return null;
  if (_wallet != null) return _wallet;
  _wallet = createWalletClient({ account, chain: getChain(), transport: http(getRpcUrl()) });
  return _wallet;
}

export function getPublicClient(): PublicClient {
  if (_public != null) return _public;
  _public = createPublicClient({ chain: getChain(), transport: http(getRpcUrl()) });
  return _public;
}

// ── TaskEscrow interactions ───────────────────────────────────────────────────

export interface SubmitWorkParams {
  onchainTaskId: bigint;
  resultHash: Hex;
}

/** Calls TaskEscrow.submitWork() using the operator wallet. Returns tx hash or null. */
export async function submitWorkOnchain(params: SubmitWorkParams): Promise<Hex | null> {
  const wallet = getWalletClient();
  const account = getOperatorAccount();
  if (!wallet || !account || !env.CONTRACT_TASK_ESCROW_ADDRESS) return null;

  const publicClient = getPublicClient();
  const contractAddress = env.CONTRACT_TASK_ESCROW_ADDRESS as `0x${string}`;

  // Simulate first to catch reverts early
  await publicClient.simulateContract({
    address: contractAddress,
    abi: taskEscrowAbi,
    functionName: 'submitWork',
    args: [params.onchainTaskId, params.resultHash],
    account,
  });

  const hash = await wallet.writeContract({
    address: contractAddress,
    abi: taskEscrowAbi,
    functionName: 'submitWork',
    args: [params.onchainTaskId, params.resultHash],
    account,
  });

  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
  return hash;
}

export interface ResolveDisputeParams {
  onchainTaskId: bigint;
  releaseToAgent: boolean;
}

/** Calls TaskEscrow.resolveDispute() — owner-only, used by admin. */
export async function resolveDisputeOnchain(params: ResolveDisputeParams): Promise<Hex | null> {
  const wallet = getWalletClient();
  const account = getOperatorAccount();
  if (!wallet || !account || !env.CONTRACT_TASK_ESCROW_ADDRESS) return null;

  const publicClient = getPublicClient();
  const contractAddress = env.CONTRACT_TASK_ESCROW_ADDRESS as `0x${string}`;

  await publicClient.simulateContract({
    address: contractAddress,
    abi: taskEscrowAbi,
    functionName: 'resolveDispute',
    args: [params.onchainTaskId, params.releaseToAgent],
    account,
  });

  const hash = await wallet.writeContract({
    address: contractAddress,
    abi: taskEscrowAbi,
    functionName: 'resolveDispute',
    args: [params.onchainTaskId, params.releaseToAgent],
    account,
  });

  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
  return hash;
}
