// x402 protocol types — AgentBay implementation.
// Protocol reference: https://x402.org
// Only the "exact" scheme (direct USDC transfer, on-chain verification) is supported in MVP.

export type X402Scheme = 'exact';

export interface PaymentScheme {
  scheme: X402Scheme;
  /** EIP-155 chain ID as a decimal string. '84532' = Base Sepolia, '8453' = Base Mainnet */
  networkId: string;
  /** USDC token contract address on the target chain */
  asset: `0x${string}`;
  /** Required payment amount in token units (USDC has 6 decimals) */
  maxAmountRequired: string;
  /** Recipient address that must receive the payment */
  payTo: `0x${string}`;
  extra?: {
    name?: string;
    description?: string;
  };
}

// Sent by the server in the X-Payment-Required header (base64-encoded JSON).
export interface PaymentRequirement {
  version: '1';
  schemes: PaymentScheme[];
}

// Sent by the client in the X-Payment header (base64-encoded JSON).
export interface PaymentProof {
  scheme: X402Scheme;
  /** Must match a scheme's networkId */
  networkId: string;
  payload: {
    /** On-chain transaction hash of the USDC transfer */
    txHash: `0x${string}`;
    /** Sender address */
    from: `0x${string}`;
    /** Must match the scheme's payTo */
    to: `0x${string}`;
    /** Token units transferred */
    amount: string;
  };
}

// Result of on-chain payment verification.
export interface VerificationResult {
  valid: boolean;
  /** Set when valid = false */
  reason?: string;
}

// Abstract replay-protection store. Implement with Redis in production.
export interface ReplayStore {
  /** Returns true if this tx hash was already accepted */
  has(txHash: string): Promise<boolean>;
  /** Mark a tx hash as used — must be idempotent */
  add(txHash: string): Promise<void>;
}

// Configuration for the server-side x402 middleware.
export interface X402Config {
  /** Payment amount in USDC 6-decimal units, e.g. 100000n = 0.10 USDC */
  amountUsdc: bigint;
  /** Address that receives the payment */
  payTo: `0x${string}`;
  /** Chain to accept payment on */
  chainId: 84532 | 8453;
  /** RPC URL for verifying on-chain transactions */
  rpcUrl: string;
  /** Store for preventing replay attacks */
  replayStore: ReplayStore;
  /** Human-readable name shown in payment UIs */
  name?: string;
  description?: string;
}

// Configuration for the client-side payableFetch.
export interface PayableFetchConfig {
  /** viem WalletClient used to sign and send the USDC transfer */
  walletClient: import('viem').WalletClient;
  /** Sender account address */
  account: `0x${string}`;
  /** RPC URL for sending transactions and polling for confirmation */
  rpcUrl: string;
  /** Maximum number of payment + retry cycles (default: 2) */
  maxPaymentRetries?: number;
}
