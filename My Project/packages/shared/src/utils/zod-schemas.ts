import { z } from "zod";

import { NodeCategory, PortType } from "../types/index.js";

// ─── Pagination ───────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// ─── Workflow ─────────────────────────────────────────────────────────────────

export const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({
    label: z.string(),
    config: z.record(z.unknown()),
    notes: z.string().optional(),
    isMuted: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    hasBreakpoint: z.boolean().optional(),
  }),
  width: z.number().optional(),
  height: z.number().optional(),
  parentId: z.string().optional(),
  extent: z.literal("parent").optional(),
});

export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.string().optional(),
  label: z.string().optional(),
});

export const workflowDefinitionSchema = z.object({
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number().min(0.1).max(4),
  }),
  variables: z.record(z.unknown()).optional(),
  settings: z.object({
    timezone: z.string().optional(),
    maxRetries: z.number().optional(),
    timeout: z.number().optional(),
    concurrency: z.number().optional(),
    onError: z.enum(["stop", "continue", "retry"]).optional(),
  }).optional(),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  folderId: z.string().optional(),
  definition: workflowDefinitionSchema.optional(),
  templateId: z.string().optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  folderId: z.string().optional().nullable(),
  definition: workflowDefinitionSchema.optional(),
  isActive: z.boolean().optional(),
  isMuted: z.boolean().optional(),
  versionMessage: z.string().max(500).optional(),
});

// ─── Execution ────────────────────────────────────────────────────────────────

export const runWorkflowSchema = z.object({
  workflowId: z.string(),
  triggerData: z.record(z.unknown()).optional(),
  startFromNodeId: z.string().optional(),
  testMode: z.boolean().optional(),
});

export const executionFiltersSchema = z.object({
  workflowId: z.string().optional(),
  status: z.enum(["PENDING", "RUNNING", "PAUSED", "SUCCESS", "FAILED", "CANCELLED"]).optional(),
  trigger: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  ...paginationSchema.shape,
});

// ─── Credential ───────────────────────────────────────────────────────────────

export const createCredentialSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["api_key", "oauth2", "basic", "bearer", "webhook_secret"]),
  service: z.string().min(1),
  data: z.record(z.unknown()),
});

// ─── Knowledge Base ───────────────────────────────────────────────────────────

export const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  embeddingModel: z.string().default("text-embedding-3-small"),
  chunkSize: z.number().min(100).max(8000).default(1000),
  chunkOverlap: z.number().min(0).max(1000).default(200),
});

// ─── Deployment ───────────────────────────────────────────────────────────────

export const createDeploymentSchema = z.object({
  workflowId: z.string(),
  name: z.string().min(1).max(255),
  type: z.enum(["CHATBOT", "FORM", "VOICE_BOT", "SLACK_BOT", "API_ENDPOINT", "SCHEDULED_JOB"]),
  config: z.record(z.unknown()),
});

// ─── Node SDK ─────────────────────────────────────────────────────────────────

export const portDefSchema = z.object({
  name: z.string(),
  type: z.nativeEnum(PortType),
  label: z.string().optional(),
  required: z.boolean().default(true),
  defaultValue: z.unknown().optional(),
  description: z.string().optional(),
});

export const paramDefSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(["string", "number", "boolean", "select", "multiselect", "textarea", "code", "credential", "json", "expression"]),
  description: z.string().optional(),
  required: z.boolean().default(false),
  default: z.unknown().optional(),
  options: z.array(z.object({ label: z.string(), value: z.unknown() })).optional(),
  placeholder: z.string().optional(),
  validation: z.record(z.unknown()).optional(),
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100).regex(/[A-Z]/, "Needs uppercase").regex(/[0-9]/, "Needs number"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
});

// ─── Node Manifest Schema (for validation) ────────────────────────────────────

export const nodeManifestSchema = z.object({
  type: z.string().regex(/^[a-z]+(\.[a-z][a-zA-Z0-9]*)+$/, "Must be dot-separated: category.name"),
  category: z.nativeEnum(NodeCategory),
  label: z.string().min(1).max(100),
  description: z.string().max(500),
  icon: z.string(),
  color: z.string(),
  inputs: z.array(portDefSchema),
  outputs: z.array(portDefSchema),
  parameters: z.array(paramDefSchema),
  docs: z.string().optional(),
  credentialType: z.string().optional(),
  version: z.string().default("1.0.0"),
});
