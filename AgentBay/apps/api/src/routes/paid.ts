// Demo paid API — demonstrates the x402 payment loop end-to-end.
// Endpoint: GET /paid/news
// Cost: 0.10 USDC per request on Base Sepolia.
//
// To test without an agent wallet, run the client smoke-test:
//   pnpm --filter @agentbay/api tsx scripts/testX402.ts
import { Hono } from 'hono';
import { x402 } from '@agentbay/x402/server';
import { createRedisReplayStore } from '@agentbay/x402/server';
import { getRedis } from '../config/redis.js';
import { env } from '../config/env.js';
import { successResponse } from '@agentbay/shared';

const paid = new Hono();

// 0.10 USDC = 100,000 units (6 decimals)
const PRICE_USDC = 100_000n;

// Static mock news data — in production this would call a real news API.
const MOCK_NEWS = [
  {
    id: '1',
    title: 'Base Mainnet Hits 10M Daily Transactions',
    summary:
      'Coinbase\'s Layer 2 network Base reached a new milestone with over 10 million daily transactions, cementing its position as a top Ethereum L2 by activity.',
    source: 'CoinDesk',
    publishedAt: '2026-05-26T09:00:00Z',
    url: 'https://www.coindesk.com/business/2026/05/26/base-mainnet-10m-daily-transactions',
    tags: ['base', 'ethereum', 'layer2'],
  },
  {
    id: '2',
    title: 'ERC-8004 Agent Identity Standard Sees First Mainnet Implementations',
    summary:
      'The ERC-8004 standard for on-chain AI agent identity is seeing growing adoption with over 500 agents registered across Base, Optimism, and Arbitrum.',
    source: 'The Defiant',
    publishedAt: '2026-05-25T14:30:00Z',
    url: 'https://thedefiant.io/erc-8004-agent-identity',
    tags: ['erc-8004', 'ai-agents', 'identity'],
  },
  {
    id: '3',
    title: 'x402 Protocol Adopted by 200+ AI Agent Platforms',
    summary:
      'The x402 HTTP-native payment protocol has crossed 200 platform integrations, enabling AI agents to autonomously pay for APIs, compute, and data without human intervention.',
    source: 'Decrypt',
    publishedAt: '2026-05-24T11:00:00Z',
    url: 'https://decrypt.co/x402-protocol-200-platforms',
    tags: ['x402', 'payments', 'ai-agents'],
  },
  {
    id: '4',
    title: 'Anthropic Releases Claude 5 with Improved Tool Use',
    summary:
      'Anthropic\'s latest model, Claude 5, demonstrates significantly improved multi-step tool use and planning capabilities, with agents completing 40% more complex tasks autonomously.',
    source: 'TechCrunch',
    publishedAt: '2026-05-23T16:00:00Z',
    url: 'https://techcrunch.com/2026/05/23/anthropic-claude-5',
    tags: ['claude', 'anthropic', 'llm'],
  },
  {
    id: '5',
    title: 'USDC Stablecoin Surpasses $100B Market Cap',
    summary:
      'Circle\'s USDC stablecoin has surpassed $100 billion in market capitalisation, driven by institutional adoption and growing usage in AI agent payment systems.',
    source: 'Bloomberg Crypto',
    publishedAt: '2026-05-22T08:00:00Z',
    url: 'https://bloomberg.com/crypto/usdc-100b',
    tags: ['usdc', 'stablecoin', 'circle'],
  },
];

// Build the x402 middleware lazily (needs Redis, which is available after startup).
// The middleware is re-used across requests via closure.
let _x402Middleware: ReturnType<typeof x402> | null = null;

function getX402Middleware() {
  if (_x402Middleware != null) return _x402Middleware;

  const recipientAddress = process.env['X402_RECIPIENT_ADDRESS'];
  if (!recipientAddress || !/^0x[0-9a-fA-F]{40}$/.test(recipientAddress)) {
    throw new Error('X402_RECIPIENT_ADDRESS env var is required and must be a valid address');
  }

  _x402Middleware = x402({
    amountUsdc: PRICE_USDC,
    payTo: recipientAddress as `0x${string}`,
    chainId: 84532, // Base Sepolia
    rpcUrl: env.BASE_SEPOLIA_RPC_URL,
    replayStore: createRedisReplayStore(getRedis()),
    name: 'AgentBay News Feed',
    description: 'Premium AI + crypto news headlines — 0.10 USDC per request',
  });
  return _x402Middleware;
}

// GET /paid/news
// Returns the latest 5 mock news items. Requires 0.10 USDC via x402.
paid.get('/news', async (c, next) => {
  await getX402Middleware()(c, next);
}, async (c) => {
  return c.json(
    successResponse({
      count: MOCK_NEWS.length,
      articles: MOCK_NEWS,
      meta: {
        pricePaidUsdc: '0.100000',
        chain: 'base-sepolia',
        requestId: c.get('requestId'),
      },
    }),
  );
});

export default paid;
