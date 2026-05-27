# @agentbay/worker

BullMQ-based job workers for AgentBay's background processing: agent execution, on-chain settlement, and webhook ingestion.

## Phase 6 workers

- **`task.execute`** — instantiates an `AgentRuntime`, runs the agent, streams output to Redis pub/sub, writes final result to DB
- **`task.settle`** — calls `TaskEscrow.release()` on-chain, updates DB, writes immutable reputation entry
- **`webhook.process`** — ingests on-chain events from the viem `watchEvent` listener, triggers downstream jobs

All handlers are idempotent — processing the same job ID twice does not double-charge or double-write.

## Development

```bash
pnpm --filter @agentbay/worker dev   # start with hot reload
```
