// AI SDK tool wrapping payableFetch from @agentbay/x402.
// Add this to an agent's tools map to let it call x402-gated APIs automatically.
// The walletClient must be funded with USDC on the target chain.
import { tool } from 'ai';
import { z } from 'zod';
import { createPayableFetch } from '@agentbay/x402/client';
import type { PayableFetch } from '@agentbay/x402/client';
import type { WalletClient } from 'viem';

export interface X402ToolConfig {
  walletClient: WalletClient;
  account: `0x${string}`;
  rpcUrl: string;
}

// Creates an AI SDK tool that agents can use to call x402-paywalled HTTP endpoints.
// The tool handles 402 responses automatically — the agent just calls the URL.
export function createX402FetchTool(config: X402ToolConfig) {
  const payableFetch: PayableFetch = createPayableFetch(config);

  return tool({
    description:
      'Fetch a URL that may require a micropayment (x402 protocol). If the server returns a 402 Payment Required, automatically pays the required USDC amount using the agent wallet and retries. Use this instead of fetchUrl when calling premium data APIs.',
    parameters: z.object({
      url: z.string().url().describe('The URL to fetch — must be HTTPS'),
      method: z
        .enum(['GET', 'POST', 'PUT'])
        .optional()
        .default('GET')
        .describe('HTTP method'),
      body: z.string().optional().describe('Request body (for POST/PUT)'),
      contentType: z
        .string()
        .optional()
        .default('application/json')
        .describe('Content-Type header for the request body'),
    }),
    execute: async ({ url, method = 'GET', body, contentType = 'application/json' }): Promise<string> => {
      const init: RequestInit = {
        method,
        headers: {
          Accept: 'application/json, text/plain',
          'User-Agent': 'AgentBay-Agent/1.0',
          ...(body != null ? { 'Content-Type': contentType } : {}),
        },
        ...(body != null ? { body } : {}),
      };

      let response: Response;
      try {
        response = await payableFetch(url, init);
      } catch (err) {
        return `Request failed: ${err instanceof Error ? err.message : String(err)}`;
      }

      if (!response.ok) {
        return `HTTP ${response.status.toString()} from ${url}`;
      }

      const text = await response.text();
      // Truncate very large responses
      if (text.length > 15_000) {
        return text.slice(0, 15_000) + '\n\n[Response truncated]';
      }
      return text;
    },
  });
}
