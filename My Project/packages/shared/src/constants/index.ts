// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_NAME = "FlowForge";
export const APP_VERSION = "0.1.0";
export const APP_URL = process.env["NEXTAUTH_URL"] ?? "http://localhost:3000";
export const API_URL = process.env["API_URL"] ?? "http://localhost:3001";

// ─── Limits ───────────────────────────────────────────────────────────────────

export const LIMITS = {
  FREE: {
    workflows: 5,
    executions_per_month: 100,
    knowledge_bases: 1,
    documents_per_kb: 10,
    deployments: 1,
    team_members: 1,
  },
  PRO: {
    workflows: 50,
    executions_per_month: 10_000,
    knowledge_bases: 10,
    documents_per_kb: 500,
    deployments: 10,
    team_members: 5,
  },
  TEAM: {
    workflows: 500,
    executions_per_month: 100_000,
    knowledge_bases: 100,
    documents_per_kb: 5000,
    deployments: 100,
    team_members: 25,
  },
  ENTERPRISE: {
    workflows: Infinity,
    executions_per_month: Infinity,
    knowledge_bases: Infinity,
    documents_per_kb: Infinity,
    deployments: Infinity,
    team_members: Infinity,
  },
} as const;

// ─── Queue Names ──────────────────────────────────────────────────────────────

export const QUEUES = {
  WORKFLOW_EXECUTION: "workflow:execution",
  SCHEDULER: "workflow:scheduler",
  WEBHOOK_INGRESS: "webhook:ingress",
  KNOWLEDGE_INGESTION: "knowledge:ingestion",
} as const;

// ─── Socket.IO Rooms ──────────────────────────────────────────────────────────

export const SOCKET_ROOMS = {
  execution: (id: string) => `execution:${id}`,
  workflow: (id: string) => `workflow:${id}`,
  workspace: (id: string) => `workspace:${id}`,
};

// ─── Canvas Constants ─────────────────────────────────────────────────────────

export const CANVAS = {
  GRID_SIZE: 20,
  SNAP_THRESHOLD: 10,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 2.5,
  DEFAULT_ZOOM: 0.8,
  NODE_WIDTH: 240,
  NODE_HEIGHT: 80,
  UNDO_LIMIT: 50,
} as const;

// ─── Supported LLM Models ─────────────────────────────────────────────────────

export const LLM_MODELS = [
  // OpenAI
  { provider: "openai", id: "gpt-4o", label: "GPT-4o", contextWindow: 128000 },
  { provider: "openai", id: "gpt-4o-mini", label: "GPT-4o Mini", contextWindow: 128000 },
  { provider: "openai", id: "o1-preview", label: "o1 Preview", contextWindow: 128000 },
  { provider: "openai", id: "o1-mini", label: "o1 Mini", contextWindow: 65536 },
  // Anthropic
  { provider: "anthropic", id: "claude-opus-4-7", label: "Claude Opus 4.7", contextWindow: 200000 },
  { provider: "anthropic", id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", contextWindow: 200000 },
  { provider: "anthropic", id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", contextWindow: 200000 },
  { provider: "anthropic", id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", contextWindow: 200000 },
  // Google
  { provider: "google", id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", contextWindow: 1000000 },
  { provider: "google", id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", contextWindow: 1000000 },
  { provider: "google", id: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash", contextWindow: 1000000 },
  // Groq
  { provider: "groq", id: "llama-3.1-70b-versatile", label: "Llama 3.1 70B", contextWindow: 128000 },
  { provider: "groq", id: "mixtral-8x7b-32768", label: "Mixtral 8x7B", contextWindow: 32768 },
  // Mistral
  { provider: "mistral", id: "mistral-large-latest", label: "Mistral Large", contextWindow: 131072 },
  { provider: "mistral", id: "mistral-small-latest", label: "Mistral Small", contextWindow: 131072 },
  // Ollama (local)
  { provider: "ollama", id: "llama3.2", label: "Llama 3.2 (local)", contextWindow: 128000 },
  { provider: "ollama", id: "mistral", label: "Mistral (local)", contextWindow: 32768 },
] as const;

export const EMBEDDING_MODELS = [
  { provider: "openai", id: "text-embedding-3-small", label: "text-embedding-3-small", dimensions: 1536 },
  { provider: "openai", id: "text-embedding-3-large", label: "text-embedding-3-large", dimensions: 3072 },
  { provider: "openai", id: "text-embedding-ada-002", label: "text-embedding-ada-002", dimensions: 1536 },
  { provider: "cohere", id: "embed-english-v3.0", label: "Cohere Embed v3", dimensions: 1024 },
] as const;
