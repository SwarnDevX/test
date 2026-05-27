# @agentbay/x402

Thin wrapper over the `@x402/*` v2 packages for AgentBay's use cases — server-side Hono middleware, client-side `payableFetch`, and agent-side automatic payment handling.

Uses v2 packages (`@x402/core`, `@x402/node`) only. The deprecated v1 Express middleware is not used.

## Phase 4 exports

- `honoPaywall(config)` — Hono middleware that enforces x402 payment on a route
- `payableFetch(wallet, config)` — drop-in fetch replacement that auto-pays 402 challenges
- `createX402Config(env)` — builds a validated x402 config from environment variables

## Usage

```ts
import { honoPaywall, payableFetch } from '@agentbay/x402';
app.use('/api/news/*', honoPaywall({ price: '0.001', asset: 'USDC' }));
```
