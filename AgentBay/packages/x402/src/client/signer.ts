// USDC transfer signer — sends a payment transaction and waits for confirmation.
// Uses viem WalletClient so it works with any signer (private key, Privy, etc.)
import {
  createPublicClient,
  http,
  erc20Abi,
  type WalletClient,
  type Hash,
} from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { USDC_ADDRESSES } from '../constants.js';
import type { PaymentScheme, PaymentProof } from '../types.js';

function getChain(networkId: string) {
  if (networkId === '84532') return baseSepolia;
  if (networkId === '8453') return base;
  throw new Error(`Unsupported networkId: ${networkId}`);
}

export interface SendPaymentResult {
  txHash: Hash;
  proof: PaymentProof;
}

// Sends a USDC transfer satisfying the required payment scheme.
// Waits for 1 confirmation before returning.
export async function sendPayment(
  scheme: PaymentScheme,
  walletClient: WalletClient,
  account: `0x${string}`,
  rpcUrl: string,
): Promise<SendPaymentResult> {
  const chain = getChain(scheme.networkId);
  const usdcAddress = USDC_ADDRESSES[Number(scheme.networkId) as 84532 | 8453];
  const amount = BigInt(scheme.maxAmountRequired);

  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });

  // Simulate first to surface revert reasons before broadcasting
  const { request } = await publicClient.simulateContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'transfer',
    args: [scheme.payTo, amount],
    account,
  });

  const txHash = await walletClient.writeContract(request);

  // Wait for confirmation
  await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });

  const proof: PaymentProof = {
    scheme: 'exact',
    networkId: scheme.networkId,
    payload: {
      txHash,
      from: account,
      to: scheme.payTo,
      amount: amount.toString(),
    },
  };

  return { txHash, proof };
}

// Encode a PaymentProof to the X-Payment header value (base64 JSON).
export function encodePaymentProof(proof: PaymentProof): string {
  return Buffer.from(JSON.stringify(proof)).toString('base64');
}
