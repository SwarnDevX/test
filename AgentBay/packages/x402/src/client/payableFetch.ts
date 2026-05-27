// payableFetch — a drop-in fetch replacement that automatically handles
// 402 Payment Required responses by paying with USDC and retrying.
//
// Usage:
//   const pFetch = createPayableFetch({ walletClient, account, rpcUrl });
//   const res = await pFetch('https://api.example.com/paid/news');
import { z } from 'zod';
import { HEADER_PAYMENT_REQUIRED, HEADER_PAYMENT, X402_VERSION } from '../constants.js';
import { sendPayment, encodePaymentProof } from './signer.js';
import type { PayableFetchConfig, PaymentRequirement, PaymentScheme } from '../types.js';

const requirementSchema = z.object({
  version: z.string(),
  schemes: z.array(
    z.object({
      scheme: z.literal('exact'),
      networkId: z.string(),
      asset: z.string(),
      maxAmountRequired: z.string(),
      payTo: z.string(),
      extra: z.object({ name: z.string().optional(), description: z.string().optional() }).optional(),
    }),
  ),
});

function parseRequirementHeader(headerValue: string): PaymentRequirement {
  const json = Buffer.from(headerValue, 'base64').toString('utf-8');
  const parsed = requirementSchema.safeParse(JSON.parse(json));
  if (!parsed.success) throw new Error('Malformed X-Payment-Required header');
  return parsed.data as PaymentRequirement;
}

// Pick the best scheme to pay with. Currently only 'exact' is supported.
function selectScheme(requirement: PaymentRequirement, preferredNetworkId?: string): PaymentScheme {
  const schemes = requirement.schemes.filter((s) => s.scheme === 'exact');
  if (preferredNetworkId != null) {
    const preferred = schemes.find((s) => s.networkId === preferredNetworkId);
    if (preferred != null) return preferred;
  }
  const scheme = schemes[0];
  if (scheme == null) throw new Error('No supported payment scheme in 402 response');
  return scheme;
}

export type PayableFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

// Factory — create a payableFetch bound to a specific wallet and RPC.
export function createPayableFetch(config: PayableFetchConfig): PayableFetch {
  const { walletClient, account, rpcUrl, maxPaymentRetries = 2 } = config;

  return async function payableFetch(
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> {
    let attempts = 0;

    const url = input instanceof Request ? input.url : String(input);

    while (attempts <= maxPaymentRetries) {
      const response = await fetch(input, init);

      if (response.status !== 402) return response;

      attempts++;
      if (attempts > maxPaymentRetries) return response;

      // Parse the payment requirement
      const requirementHeader = response.headers.get(HEADER_PAYMENT_REQUIRED);
      if (!requirementHeader) {
        throw new Error(`Server returned 402 but no ${HEADER_PAYMENT_REQUIRED} header`);
      }

      let requirement: PaymentRequirement;
      try {
        requirement = parseRequirementHeader(requirementHeader);
      } catch (err) {
        throw new Error(`Could not parse payment requirement: ${String(err)}`);
      }

      if (requirement.version !== X402_VERSION) {
        throw new Error(`Unsupported x402 version: ${requirement.version}`);
      }

      const scheme = selectScheme(requirement);

      // Send the payment
      const { proof } = await sendPayment(scheme, walletClient, account, rpcUrl);
      const encodedProof = encodePaymentProof(proof);

      // Retry the request with the payment proof attached
      const retryInit: RequestInit = {
        ...init,
        headers: {
          ...(init?.headers instanceof Headers
            ? Object.fromEntries((init.headers as Headers).entries())
            : (init?.headers as Record<string, string> | undefined) ?? {}),
          [HEADER_PAYMENT]: encodedProof,
        },
      };

      input = new Request(url, retryInit);
      init = undefined;
    }

    // Should not reach here, but TypeScript requires it
    return fetch(input, init);
  };
}
