// On-chain payment verification for the x402 "exact" scheme.
// Fetches the transaction receipt and checks for a valid USDC Transfer event.
import { createPublicClient, http, erc20Abi, decodeEventLog } from 'viem';
import { baseSepolia, base } from 'viem/chains';
import { z } from 'zod';
import { USDC_ADDRESSES, HEADER_PAYMENT, REPLAY_TTL_SECONDS } from '../constants.js';
import type { PaymentProof, PaymentScheme, VerificationResult, ReplayStore } from '../types.js';

const proofSchema = z.object({
  scheme: z.literal('exact'),
  networkId: z.string(),
  payload: z.object({
    txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    from: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    to: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    amount: z.string().regex(/^\d+$/),
  }),
});

function getChain(networkId: string) {
  if (networkId === '84532') return baseSepolia;
  if (networkId === '8453') return base;
  throw new Error(`Unsupported networkId: ${networkId}`);
}

// Parse the X-Payment header value into a PaymentProof.
export function parsePaymentHeader(headerValue: string): PaymentProof {
  const json = Buffer.from(headerValue, 'base64').toString('utf-8');
  const parsed = proofSchema.safeParse(JSON.parse(json));
  if (!parsed.success) {
    throw new Error(`Invalid payment proof: ${parsed.error.message}`);
  }
  return parsed.data as PaymentProof;
}

// Verify an on-chain USDC transfer matches the required payment scheme.
// Steps:
//   1. Parse and sanity-check the proof
//   2. Check replay store
//   3. Fetch tx receipt on-chain
//   4. Find a Transfer(from, to=payTo, amount>=required) log on the USDC contract
//   5. Mark tx hash as used in replay store
export async function verifyPayment(
  headerValue: string,
  scheme: PaymentScheme,
  replayStore: ReplayStore,
  rpcUrl: string,
): Promise<VerificationResult> {
  let proof: PaymentProof;
  try {
    proof = parsePaymentHeader(headerValue);
  } catch (err) {
    return { valid: false, reason: `Could not parse payment header: ${String(err)}` };
  }

  if (proof.networkId !== scheme.networkId) {
    return { valid: false, reason: `Wrong network: expected ${scheme.networkId}, got ${proof.networkId}` };
  }

  if (proof.payload.to.toLowerCase() !== scheme.payTo.toLowerCase()) {
    return { valid: false, reason: `Payment sent to wrong address: ${proof.payload.to}` };
  }

  if (BigInt(proof.payload.amount) < BigInt(scheme.maxAmountRequired)) {
    return {
      valid: false,
      reason: `Insufficient payment: ${proof.payload.amount} < ${scheme.maxAmountRequired}`,
    };
  }

  // Replay check before the RPC call (fast path)
  if (await replayStore.has(proof.payload.txHash)) {
    return { valid: false, reason: 'Payment tx already used (replay detected)' };
  }

  // On-chain verification
  const chain = getChain(proof.networkId);
  const client = createPublicClient({ chain, transport: http(rpcUrl) });

  let receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>>;
  try {
    receipt = await client.getTransactionReceipt({ hash: proof.payload.txHash as `0x${string}` });
  } catch {
    return { valid: false, reason: 'Transaction not found on-chain' };
  }

  if (receipt.status !== 'success') {
    return { valid: false, reason: 'Transaction reverted or failed' };
  }

  const usdcAddress = USDC_ADDRESSES[Number(proof.networkId) as 84532 | 8453];
  let transferFound = false;

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== usdcAddress.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: erc20Abi,
        eventName: 'Transfer',
        data: log.data,
        topics: log.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
      });
      const to = String(decoded.args.to ?? '').toLowerCase();
      const value = decoded.args.value ?? 0n;

      if (
        to === scheme.payTo.toLowerCase() &&
        value >= BigInt(scheme.maxAmountRequired)
      ) {
        transferFound = true;
        break;
      }
    } catch {
      // Not a Transfer log — skip
    }
  }

  if (!transferFound) {
    return {
      valid: false,
      reason: `No USDC Transfer of >= ${scheme.maxAmountRequired} units to ${scheme.payTo} found in tx`,
    };
  }

  // Mark as used — prevents replay
  await replayStore.add(proof.payload.txHash);

  return { valid: true };
}

// Encode a PaymentRequirement object into the X-Payment-Required header value.
export function encodePaymentRequired(requirement: import('../types.js').PaymentRequirement): string {
  return Buffer.from(JSON.stringify(requirement)).toString('base64');
}

// Extract the X-Payment header from a Hono context or generic headers object.
export function extractPaymentHeader(headers: { get(name: string): string | null }): string | null {
  return headers.get(HEADER_PAYMENT);
}
