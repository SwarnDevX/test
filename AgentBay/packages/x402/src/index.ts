// @agentbay/x402 — public API
// Sub-path exports: @agentbay/x402/server and @agentbay/x402/client
// are also available and built as separate entry points.

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  X402Scheme,
  PaymentScheme,
  PaymentRequirement,
  PaymentProof,
  VerificationResult,
  ReplayStore,
  X402Config,
  PayableFetchConfig,
} from './types.js';

// ── Constants ─────────────────────────────────────────────────────────────────
export {
  USDC_ADDRESSES,
  X402_VERSION,
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT,
  REPLAY_TTL_SECONDS,
  MIN_USDC_UNITS,
} from './constants.js';

// ── Server (also available as @agentbay/x402/server) ─────────────────────────
export { x402 } from './server/middleware.js';
export { verifyPayment, parsePaymentHeader, encodePaymentRequired } from './server/verify.js';
export { createRedisReplayStore, createMemoryReplayStore } from './server/redisReplayStore.js';

// ── Client (also available as @agentbay/x402/client) ─────────────────────────
export { createPayableFetch } from './client/payableFetch.js';
export type { PayableFetch } from './client/payableFetch.js';
export { sendPayment, encodePaymentProof } from './client/signer.js';
