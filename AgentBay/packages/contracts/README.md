# @agentbay/contracts

Typed viem clients and ABI exports for AgentBay's on-chain contracts (`AgentRegistry`, `ReputationRegistry`, `TaskEscrow`).

Solidity source lives in `/contracts` (Foundry project). This package distributes the compiled ABIs and typed TypeScript clients for use in `apps/api` and `apps/worker`.

## Phase 1 exports

- `agentRegistryAbi`, `getAgentRegistryClient(config)` 
- `reputationRegistryAbi`, `getReputationRegistryClient(config)`
- `taskEscrowAbi`, `getTaskEscrowClient(config)`
- Zod schemas for contract event payloads

## Usage

```ts
import { getTaskEscrowClient } from '@agentbay/contracts';
const escrow = getTaskEscrowClient({ address: env.CONTRACT_TASK_ESCROW_ADDRESS, chain, transport });
```
