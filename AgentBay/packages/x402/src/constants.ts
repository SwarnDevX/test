// USDC contract addresses — must match TaskEscrow.sol
export const USDC_ADDRESSES = {
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // Base Mainnet
} as const satisfies Record<number, `0x${string}`>;

// Protocol version we produce and accept
export const X402_VERSION = '1' as const;

// HTTP header names
export const HEADER_PAYMENT_REQUIRED = 'X-Payment-Required';
export const HEADER_PAYMENT = 'X-Payment';

// Replay store TTL: transactions are final after 24h so we only need to track that long
export const REPLAY_TTL_SECONDS = 86_400;

// Minimum USDC units we'll accept (guards against dust payments)
export const MIN_USDC_UNITS = 1n; // 0.000001 USDC
