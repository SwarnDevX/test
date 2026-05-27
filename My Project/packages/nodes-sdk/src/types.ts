import type { NodeCategory, PortType, RetryPolicy } from "@flowforge/shared";
import { z } from "zod";

// ─── Port Definition ──────────────────────────────────────────────────────────

export interface PortDef {
  name: string;
  type: PortType;
  label?: string;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
}

// ─── Parameter Definition ─────────────────────────────────────────────────────

export type ParamType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "textarea"
  | "code"
  | "credential"
  | "json"
  | "expression";

export interface SelectOption {
  label: string;
  value: unknown;
}

export interface ParamDef {
  name: string;
  label: string;
  type: ParamType;
  description?: string;
  required?: boolean;
  default?: unknown;
  // Accepts either { label, value } objects or plain strings (auto-mapped to { label: s, value: s })
  options?: (SelectOption | string)[];
  placeholder?: string;
  language?: "javascript" | "python" | "sql" | "json"; // for 'code' type
  credentialTypes?: string[]; // for 'credential' type
  validation?: z.ZodType;
  dependsOn?: { param: string; value: unknown }; // conditional display
}

// ─── Node Executor Context ─────────────────────────────────────────────────────

export interface NodeExecutorContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  workspaceId: string;
  params: Record<string, unknown>;
  inputs: Record<string, unknown>;
  getCredential: (credentialId: string) => Promise<Record<string, string>>;
  emit: (event: string, data: unknown) => void;
  signal: AbortSignal;
  logger: {
    info: (msg: string, meta?: unknown) => void;
    warn: (msg: string, meta?: unknown) => void;
    error: (msg: string, meta?: unknown) => void;
  };
  resolveExpression: (template: string, data?: Record<string, unknown>) => unknown;
  env: Record<string, string>;
}

export type NodeExecutorOutput = Record<string, unknown>;

export interface NodeExecutor {
  (ctx: NodeExecutorContext): Promise<NodeExecutorOutput>;
}

// ─── Node Manifest ────────────────────────────────────────────────────────────

export interface NodeManifest {
  type: string;              // "ai.chatCompletion" — dot-separated, category.name
  category: NodeCategory;
  label: string;
  description: string;
  icon: string;              // lucide icon name (e.g. "MessageSquare") or SVG data URI
  color: string;             // OKLCH color for node header background
  inputs: PortDef[];
  outputs: PortDef[];
  parameters: ParamDef[];
  executor: NodeExecutor;
  docs?: string;             // markdown documentation
  credentialType?: string;   // if node requires credentials
  version?: string;
  retryPolicy?: Partial<RetryPolicy>;
  isDeprecated?: boolean;
  replacedBy?: string;
}

// ─── Node Registry ────────────────────────────────────────────────────────────

export interface NodeRegistryEntry {
  manifest: NodeManifest;
  registeredAt: Date;
  isBuiltIn: boolean;
  pluginId?: string;
}

// ─── Plugin SDK Interface ─────────────────────────────────────────────────────

export interface FlowForgePlugin {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  nodes: NodeManifest[];
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
}

// ─── Expression Template ──────────────────────────────────────────────────────

export interface ExpressionContext {
  nodes: Record<string, unknown>; // previous node outputs by nodeId
  trigger: unknown;               // trigger data
  variables: Record<string, unknown>; // workflow variables
  env: Record<string, string>;    // environment variables
  execution: {
    id: string;
    startedAt: Date;
  };
}
