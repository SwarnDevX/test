#!/usr/bin/env tsx
// Smoke-test for the x402 payment loop.
// Prerequisites:
//   1. API running:  pnpm --filter @agentbay/api dev
//   2. .env has:     BASE_SEPOLIA_RPC_URL, X402_RECIPIENT_ADDRESS
//   3. You have:     TEST_PRIVATE_KEY (funded with Base Sepolia ETH + USDC)
//
// Run:  pnpm --filter @agentbay/api tsx scripts/testX402.ts
import { createWalletClient, http, privateKeyToAccount } from 'viem';
import { baseSepolia } from 'viem/chains';
import { createPayableFetch } from '@agentbay/x402/client';

const privateKey = process.env['TEST_PRIVATE_KEY'];
if (!privateKey) {
  process.stderr.write('TEST_PRIVATE_KEY env var is required\n');
  process.exit(1);
}

const rpcUrl = process.env['BASE_SEPOLIA_RPC_URL'];
if (!rpcUrl) {
  process.stderr.write('BASE_SEPOLIA_RPC_URL env var is required\n');
  process.exit(1);
}

const account = privateKeyToAccount(privateKey as `0x${string}`);
process.stdout.write(`Using account: ${account.address}\n`);

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(rpcUrl),
});

const payableFetch = createPayableFetch({
  walletClient,
  account: account.address,
  rpcUrl,
});

const apiBase = process.env['API_URL'] ?? 'http://localhost:3001';
const endpoint = `${apiBase}/paid/news`;

process.stdout.write(`\nFetching ${endpoint} (0.10 USDC required)...\n`);

try {
  const response = await payableFetch(endpoint);

  if (!response.ok) {
    process.stdout.write(`\nFailed: HTTP ${response.status.toString()}\n`);
    process.stdout.write(await response.text());
    process.exit(1);
  }

  const data = await response.json();
  process.stdout.write('\nSuccess! Response:\n');
  process.stdout.write(JSON.stringify(data, null, 2));
  process.stdout.write('\n');
} catch (err) {
  process.stderr.write(`\nError: ${String(err)}\n`);
  process.exit(1);
}
