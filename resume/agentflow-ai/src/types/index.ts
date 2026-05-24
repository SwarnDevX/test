import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Agent types
// ─────────────────────────────────────────────────────────────────────────────

export const PlanStepSchema = z.object({
  id: z.string(),
  type: z.enum(['retrieve', 'execute', 'analyze', 'generate', 'validate', 'transform']),
  description: z.string(),
  tool: z.string().nullable(),
  params: z.record(z.unknown()).default({}),
  dependencies: z.array(z.string()).default([]),
  estimatedTokens: z.number().default(200),
})
export type PlanStep = z.infer<typeof PlanStepSchema>

export const AgentPlanSchema = z.object({
  goal: z.string(),
  reasoning: z.string(),
  steps: z.array(PlanStepSchema),
  expectedOutcome: z.string(),
  riskFactors: z.array(z.string()).default([]),
})
export type AgentPlan = z.infer<typeof AgentPlanSchema>

export const StepResultSchema = z.object({
  stepId: z.string(),
  success: z.boolean(),
  result: z.string(),
  toolUsed: z.string().nullable(),
  toolParams: z.record(z.unknown()).default({}),
  toolOutput: z.unknown().optional(),
  reasoning: z.string(),
  tokensUsed: z.number().default(0),
  error: z.string().nullable(),
})
export type StepResult = z.infer<typeof StepResultSchema>

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  confidence: z.number().min(0).max(1),
  qualityScore: z.number().min(0).max(1),
  issues: z.array(z.string()).default([]),
  refinements: z.array(z.string()).default([]),
  finalResponse: z.string(),
  summary: z.string(),
  tokensUsed: z.number().default(0),
})
export type ValidationResult = z.infer<typeof ValidationResultSchema>

export interface AgentInput {
  message: string
  sessionId?: string
  context?: string
  history?: Array<{ role: string; content: string }>
  traceId?: string
}

export interface AgentOutput {
  plan: AgentPlan
  results: StepResult[]
  validation: ValidationResult
  totalTokens: number
  totalCost: number
  latencyMs: number
  traceId: string
}

export type AgentRole = 'planner' | 'executor' | 'validator'
export type StepType = 'plan' | 'execute' | 'validate' | 'tool_call' | 'rag_retrieve'

export interface AgentMessage {
  role: AgentRole
  type: StepType
  payload: unknown
  timestamp: string
  traceId: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool types
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required?: boolean
  enum?: string[]
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, ToolParameter>
  execute: (params: Record<string, unknown>) => Promise<ToolResult>
}

export interface ToolResult {
  success: boolean
  data: unknown
  error?: string
  metadata?: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────────────────────
// RAG types
// ─────────────────────────────────────────────────────────────────────────────

export interface Chunk {
  id: string
  docId: string
  content: string
  embedding?: number[]
  chunkIndex: number
  metadata?: Record<string, unknown>
}

export interface RetrievalResult {
  chunk: Chunk
  score: number
  docName?: string
}

export interface RAGQueryInput {
  query: string
  topK?: number
  minScore?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Workflow types
// ─────────────────────────────────────────────────────────────────────────────

export type WorkflowStepType =
  | 'llm_call'
  | 'api_call'
  | 'db_query'
  | 'condition'
  | 'transform'
  | 'agent_task'
  | 'rag_search'

export interface WorkflowStep {
  id: string
  name: string
  type: WorkflowStepType
  config: Record<string, unknown>
  nextSteps?: string[]
  onError?: 'fail' | 'skip' | 'retry'
  maxRetries?: number
}

export interface WorkflowDefinition {
  id?: string
  name: string
  description?: string
  steps: WorkflowStep[]
  input?: Record<string, unknown>
}

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface WorkflowRunState {
  runId: string
  workflowId: string
  status: WorkflowStatus
  currentStep: string | null
  completedSteps: string[]
  stepOutputs: Record<string, unknown>
  startedAt: Date
  error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Observability types
// ─────────────────────────────────────────────────────────────────────────────

export type ObsEventType =
  | 'token_usage'
  | 'latency'
  | 'error'
  | 'agent_step'
  | 'tool_call'
  | 'rag_query'
  | 'workflow_step'

export interface ObsEventData {
  eventType: ObsEventType
  agent?: string
  model?: string
  tokens?: number
  latencyMs?: number
  cost?: number
  metadata?: Record<string, unknown>
}

export interface DashboardMetrics {
  totalRequests: number
  totalTokens: number
  totalCost: number
  avgLatencyMs: number
  errorRate: number
  requestsToday: number
  tokensToday: number
  costToday: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Streaming event types (SSE payload shapes)
// ─────────────────────────────────────────────────────────────────────────────

export type StreamEventType =
  | 'agent:start'
  | 'agent:plan'
  | 'agent:step'
  | 'agent:tool'
  | 'agent:validate'
  | 'agent:complete'
  | 'token'
  | 'error'
  | 'workflow:step'
  | 'workflow:complete'
  // Frontend-facing workflow run events (translated from workflow:step)
  | 'node_start'
  | 'node_done'
  | 'completed'

export interface StreamEvent {
  type: StreamEventType
  data: unknown
  timestamp: string
}
