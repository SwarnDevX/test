// Hono middleware factory for x402 payment gating.
// Usage:
//   import { x402 } from '@agentbay/x402/server';
//   app.get('/paid/resource', x402({ amountUsdc: 100000n, payTo: '0x...', ... }), handler);
import { createMiddleware } from 'hono/factory';
import { USDC_ADDRESSES, X402_VERSION, HEADER_PAYMENT_REQUIRED, HEADER_PAYMENT } from '../constants.js';
import { encodePaymentRequired, verifyPayment } from './verify.js';
import { PaymentError } from '@agentbay/shared';
import type { X402Config, PaymentRequirement } from '../types.js';

export function x402(config: X402Config) {
  const { amountUsdc, payTo, chainId, rpcUrl, replayStore, name, description } = config;

  const scheme = {
    scheme: 'exact' as const,
    networkId: String(chainId),
    asset: USDC_ADDRESSES[chainId],
    maxAmountRequired: amountUsdc.toString(),
    payTo,
    ...(name != null || description != null ? { extra: { name, description } } : {}),
  };

  const requirement: PaymentRequirement = {
    version: X402_VERSION,
    schemes: [scheme],
  };

  const encodedRequirement = encodePaymentRequired(requirement);

  return createMiddleware(async (c, next) => {
    const paymentHeader = c.req.header(HEADER_PAYMENT);

    if (!paymentHeader) {
      // No payment provided — return 402 with requirements
      c.header(HEADER_PAYMENT_REQUIRED, encodedRequirement);
      return c.json(
        {
          ok: false,
          error: {
            code: 'PAYMENT_REQUIRED',
            message: `This resource requires ${formatUsdc(amountUsdc)} USDC payment`,
            requirements: requirement,
          },
        },
        402,
      );
    }

    // Payment header present — verify on-chain
    const result = await verifyPayment(paymentHeader, scheme, replayStore, rpcUrl);

    if (!result.valid) {
      throw new PaymentError(result.reason ?? 'Payment verification failed');
    }

    // Store verified payment info in context for downstream handlers
    c.set('x402Payment', { scheme, verified: true });

    await next();
  });
}

function formatUsdc(units: bigint): string {
  const whole = units / 1_000_000n;
  const fraction = units % 1_000_000n;
  return `${whole.toString()}.${fraction.toString().padStart(6, '0').replace(/0+$/, '') || '00'}`;
}
