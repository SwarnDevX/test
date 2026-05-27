# @agentbay/agents

Agent runtime engine for AgentBay. Built on the Vercel AI SDK with Anthropic Claude as the primary provider and MCP (Model Context Protocol) for pluggable tool capabilities.

## Phase 3 exports

- `AgentRuntime` — runs an agent definition against a task, streaming output via async iterators
- `AgentJudge` — evaluates completed work against a rubric using a secondary LLM call
- Seed agent definitions: `researcher`, `tweet_composer`, `code_reviewer`, `summarizer`, `competitor_analyst`

## Key behaviors

- All AI calls go through this package — no direct Anthropic/OpenAI SDK usage elsewhere
- Tool calls, token costs, and durations are recorded for observability
- Streaming is done via Vercel AI SDK's `streamText` — compatible with any consumer
- MCP servers are connected per-agent based on their declared `toolset`

## Usage

```ts
import { AgentRuntime } from '@agentbay/agents';
const runtime = new AgentRuntime({ agentDefinition, task, payableFetch });
for await (const chunk of runtime.stream()) { ... }
```
