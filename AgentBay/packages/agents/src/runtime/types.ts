// Targets: ai@4.3.x, @ai-sdk/anthropic@1.2.x, @modelcontextprotocol/sdk@1.12.x
import type { CoreMessage, ToolSet } from 'ai';

// ── Agent configuration ───────────────────────────────────────────────────────

export interface McpServerConfig {
  /** Display name for logging */
  name: string;
  /** SSE endpoint URL for the MCP server */
  url: string;
}

export interface AgentConfig {
  /** Stable slug used as the agent's identifier in SEED_AGENTS */
  id: string;
  name: string;
  description: string;
  /** Anthropic model ID */
  model: AnthropicModelId;
  systemPrompt: string;
  /** Built-in AI SDK tools available to this agent */
  tools: ToolSet;
  /** Optional external MCP servers to connect to on startup */
  mcpServers?: McpServerConfig[];
  /** Maximum number of LLM round-trips (default: 20) */
  maxSteps?: number;
  temperature?: number;
  /** Capability strings registered in AgentRegistry.sol */
  capabilities: string[];
}

export type AnthropicModelId =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001';

// ── Runtime I/O ───────────────────────────────────────────────────────────────

export interface AgentInput {
  taskId: string;
  /** Full conversation history */
  messages: CoreMessage[];
  /** Optional extra context injected into the system prompt */
  context?: string;
}

export interface AgentResult {
  taskId: string;
  output: string;
  toolCallLog: ToolCallRecord[];
  metrics: RunMetrics;
  finishReason: string;
}

// ── Stream events ─────────────────────────────────────────────────────────────

export type AgentStreamEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: unknown }
  | { type: 'tool-result'; toolCallId: string; toolName: string; result: unknown; durationMs: number }
  | { type: 'step-finish'; stepIndex: number; inputTokens: number; outputTokens: number }
  | { type: 'finish'; output: string; finishReason: string; metrics: RunMetrics };

// ── Metrics ───────────────────────────────────────────────────────────────────

export interface ToolCallRecord {
  toolName: string;
  args: unknown;
  result: unknown;
  durationMs: number;
  stepIndex: number;
}

export interface RunMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  totalSteps: number;
  totalDurationMs: number;
  toolCallLog: ToolCallRecord[];
}

// ── Judge ─────────────────────────────────────────────────────────────────────

export interface JudgeCriterion {
  name: string;
  description: string;
  /** Relative weight 0–1; all criteria weights must sum to 1.0 */
  weight: number;
}

export interface JudgeRubric {
  criteria: JudgeCriterion[];
  /** Score threshold 0–100 required to pass */
  minPassingScore: number;
}

export interface JudgeInput {
  taskDescription: string;
  agentOutput: string;
  rubric: JudgeRubric;
}

export interface CriterionScore {
  name: string;
  score: number; // 0–100
  feedback: string;
}

export interface JudgeResult {
  passed: boolean;
  /** Weighted overall score 0–100 */
  score: number;
  summary: string;
  criteriaScores: CriterionScore[];
}
