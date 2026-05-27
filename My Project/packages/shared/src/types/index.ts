// ─── Port Types ────────────────────────────────────────────────────────────────

export const PortType = {
  STRING: "STRING",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
  JSON: "JSON",
  FILE: "FILE",
  IMAGE: "IMAGE",
  AUDIO: "AUDIO",
  VECTOR: "VECTOR",
  ANY: "ANY",
} as const;
// Union type — string literals are directly assignable without importing PortType
export type PortType = (typeof PortType)[keyof typeof PortType];

export const PORT_COLORS: Record<PortType, string> = {
  [PortType.STRING]: "oklch(72% 0.17 145)",   // green
  [PortType.NUMBER]: "oklch(68% 0.19 50)",    // orange
  [PortType.BOOLEAN]: "oklch(65% 0.18 240)",  // blue
  [PortType.JSON]: "oklch(75% 0.15 290)",     // purple
  [PortType.FILE]: "oklch(70% 0.16 25)",      // warm red
  [PortType.IMAGE]: "oklch(80% 0.18 85)",     // yellow
  [PortType.AUDIO]: "oklch(72% 0.20 320)",    // pink
  [PortType.VECTOR]: "oklch(65% 0.20 195)",   // cyan
  [PortType.ANY]: "oklch(60% 0.01 260)",      // gray
};

export function isPortCompatible(source: PortType, target: PortType): boolean {
  if (source === PortType.ANY || target === PortType.ANY) return true;
  return source === target;
}

// ─── Node Categories ──────────────────────────────────────────────────────────

export const NodeCategory = {
  TRIGGER: "TRIGGER",
  LOGIC: "LOGIC",
  DATA: "DATA",
  AI: "AI",
  AGENT: "AGENT",
  CODE: "CODE",
  INTEGRATION: "INTEGRATION",
  OUTPUT: "OUTPUT",
} as const;
// Union type — string literals are directly assignable without importing NodeCategory
export type NodeCategory = (typeof NodeCategory)[keyof typeof NodeCategory];

export const CATEGORY_COLORS: Record<NodeCategory, string> = {
  [NodeCategory.TRIGGER]: "oklch(65% 0.22 25)",   // red
  [NodeCategory.LOGIC]: "oklch(65% 0.18 240)",    // blue
  [NodeCategory.DATA]: "oklch(68% 0.19 50)",      // orange
  [NodeCategory.AI]: "oklch(75% 0.15 290)",       // purple
  [NodeCategory.AGENT]: "oklch(72% 0.20 320)",    // pink
  [NodeCategory.CODE]: "oklch(72% 0.17 145)",     // green
  [NodeCategory.INTEGRATION]: "oklch(80% 0.18 85)", // yellow
  [NodeCategory.OUTPUT]: "oklch(65% 0.20 195)",   // cyan
};

// ─── Workflow Definition ───────────────────────────────────────────────────────

export interface WorkflowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface WorkflowNodeData {
  label: string;
  config: Record<string, unknown>;
  notes?: string;
  isMuted?: boolean;
  isLocked?: boolean;
  hasBreakpoint?: boolean;
  pinnedResult?: unknown;
  retryPolicy?: RetryPolicy;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: NodePosition;
  data: WorkflowNodeData;
  width?: number;
  height?: number;
  parentId?: string;  // for sub-workflow groups
  extent?: "parent";
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: WorkflowViewport;
  variables?: Record<string, unknown>;
  settings?: WorkflowSettings;
}

export interface WorkflowSettings {
  timezone?: string;
  maxRetries?: number;
  timeout?: number;
  concurrency?: number;
  onError?: "stop" | "continue" | "retry";
}

// ─── Retry Policy ─────────────────────────────────────────────────────────────

export interface RetryPolicy {
  maxAttempts: number;
  backoffType: "fixed" | "exponential";
  baseDelay: number;  // ms
  maxDelay: number;   // ms
  onError: "stop" | "continue" | "branch";
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoffType: "exponential",
  baseDelay: 1000,
  maxDelay: 30000,
  onError: "stop",
};

// ─── Execution Events (Socket.IO) ─────────────────────────────────────────────

export type ExecutionEventType =
  | "execution_start"
  | "execution_done"
  | "execution_error"
  | "execution_paused"
  | "node_start"
  | "node_output"
  | "node_stream"
  | "node_error"
  | "node_done"
  | "node_muted"
  | "node_skipped";

export interface NodeMutedEvent extends BaseExecutionEvent {
  type: "node_muted";
  nodeId: string;
}

export interface BaseExecutionEvent {
  executionId: string;
  workflowId: string;
  timestamp: number;
}

export interface ExecutionStartEvent extends BaseExecutionEvent {
  type: "execution_start";
  trigger: string;
}

export interface ExecutionDoneEvent extends BaseExecutionEvent {
  type: "execution_done";
  durationMs: number;
  totalTokens: number;
  totalCostUsd: number;
}

export interface ExecutionErrorEvent extends BaseExecutionEvent {
  type: "execution_error";
  error: string;
  nodeId?: string;
}

export interface NodeStartEvent extends BaseExecutionEvent {
  type: "node_start";
  nodeId: string;
  nodeType: string;
  inputData: unknown;
}

export interface NodeOutputEvent extends BaseExecutionEvent {
  type: "node_output";
  nodeId: string;
  outputData: unknown;
  tokens?: number;
  costUsd?: number;
}

export interface NodeStreamEvent extends BaseExecutionEvent {
  type: "node_stream";
  nodeId: string;
  chunk: string;
  done: boolean;
}

export interface NodeErrorEvent extends BaseExecutionEvent {
  type: "node_error";
  nodeId: string;
  error: string;
  retryAttempt?: number;
}

export interface NodeDoneEvent extends BaseExecutionEvent {
  type: "node_done";
  nodeId: string;
  status: "success" | "failed" | "skipped" | "muted";
  durationMs: number;
}

export type ExecutionEvent =
  | ExecutionStartEvent
  | ExecutionDoneEvent
  | ExecutionErrorEvent
  | NodeStartEvent
  | NodeOutputEvent
  | NodeStreamEvent
  | NodeErrorEvent
  | NodeDoneEvent
  | NodeMutedEvent;

// ─── Cost Tracking ────────────────────────────────────────────────────────────

export interface CostRecord {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

// Prices per 1M tokens in USD (as of 2025)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 5.0, output: 15.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4.0 },
  "claude-opus-4-7": { input: 15.0, output: 75.0 },
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "mixtral-8x7b-32768": { input: 0.24, output: 0.24 },
  "llama-3.1-70b-versatile": { input: 0.59, output: 0.79 },
  "text-embedding-3-small": { input: 0.02, output: 0 },
  "text-embedding-3-large": { input: 0.13, output: 0 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
