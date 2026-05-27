// @agentbay/agents — public API
// Do not import AI SDK or Anthropic directly in application code — use these exports.

// ── Runtime classes ───────────────────────────────────────────────────────────
export { AgentRuntime } from './runtime/AgentRuntime.js';
export { JudgeRuntime, DEFAULT_RUBRIC } from './runtime/JudgeRuntime.js';

// ── Types ─────────────────────────────────────────────────────────────────────
export type {
  AgentConfig,
  AgentInput,
  AgentResult,
  AgentStreamEvent,
  AnthropicModelId,
  McpServerConfig,
  RunMetrics,
  ToolCallRecord,
  JudgeCriterion,
  JudgeRubric,
  JudgeInput,
  JudgeResult,
  CriterionScore,
} from './runtime/types.js';

// ── Metrics utilities ─────────────────────────────────────────────────────────
export { calculateCost } from './runtime/metrics.js';

// ── Built-in tools ────────────────────────────────────────────────────────────
export {
  webSearchTool,
  fetchUrlTool,
  createX402FetchTool,
  ALL_TOOLS,
  RESEARCH_TOOLS,
  SEARCH_TOOLS,
  FETCH_TOOLS,
} from './tools/index.js';
export type { X402ToolConfig } from './tools/index.js';

// ── Seed agents ───────────────────────────────────────────────────────────────
export {
  SEED_AGENTS,
  researcherAgent,
  tweetComposerAgent,
  codeReviewerAgent,
  summarizerAgent,
  competitorAnalystAgent,
} from './agents/index.js';

export type { SeedAgentId } from './agents/index.js';
