'use client';
// Typed API client — thin wrapper around fetch that targets the Hono backend.
// Credentials are sent as cookies (httpOnly session managed by the API).
import type {
  Task,
  TaskDetail,
  Agent,
  AgentDetail,
  Bid,
  PaginatedResponse,
  User,
  ApiResponse,
  ApiError,
  PlatformStats,
  AdminTask,
  AdminUser,
  AdminAgent,
  AdminDispute,
} from './types.js';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { params?: Record<string, string> },
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (init?.params) {
    for (const [k, v] of Object.entries(init.params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const json = (await res.json()) as ApiResponse<T> | ApiError;

  if (!json.ok) {
    throw new ApiRequestError(json.error.code, json.error.message, res.status);
  }

  return json.data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  me: () => request<User>('/auth/me'),
  nonce: () => request<{ nonce: string }>('/auth/nonce'),
  verify: (message: string, signature: string) =>
    request<{ user: User }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ message, signature }),
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasks = {
  list: (params?: { status?: string; tag?: string; cursor?: string; limit?: string }) =>
    request<PaginatedResponse<Task>>('/tasks', {
      params: Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined),
      ) as Record<string, string>,
    }),

  get: (id: string) => request<TaskDetail>(`/tasks/${id}`),

  create: (
    body: { title: string; description: string; budgetUsdc: string; tags?: string[]; deadline?: string },
    idempotencyKey: string,
  ) =>
    request<{ task: Task; onchain: unknown }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  assign: (taskId: string, bidId: string, idempotencyKey: string) =>
    request<{ task: Task; assignment: unknown }>(`/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ bidId }),
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  accept: (taskId: string, rating: number, reviewText: string, idempotencyKey: string) =>
    request<{ task: Task }>(`/tasks/${taskId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ rating, reviewText }),
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  dispute: (taskId: string, idempotencyKey: string) =>
    request<{ task: Task }>(`/tasks/${taskId}/dispute`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  realtimeToken: (taskId: string) =>
    request<{ token: string }>(`/tasks/${taskId}/realtime-token`),
};

// ── Agents ────────────────────────────────────────────────────────────────────

export const agents = {
  list: (params?: { capability?: string; minRating?: string; cursor?: string }) =>
    request<PaginatedResponse<Agent>>('/agents', {
      params: Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined),
      ) as Record<string, string>,
    }),

  get: (id: string) => request<AgentDetail>(`/agents/${id}`),

  create: (
    body: { name: string; description: string; capabilities: string[]; metadataUri?: string },
    idempotencyKey: string,
  ) =>
    request<{ agent: Agent; onchain: unknown }>('/agents', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  update: (id: string, body: { name?: string; description?: string; capabilities?: string[] }) =>
    request<{ agent: Agent }>(`/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};

// ── Bids ──────────────────────────────────────────────────────────────────────

export const bids = {
  list: (taskId: string) => request<{ bids: Bid[] }>(`/bids?taskId=${taskId}`),

  create: (
    taskId: string,
    body: { priceUsdc: string; etaHours: number; coverNote?: string; sampleOutput?: string },
    idempotencyKey: string,
  ) =>
    request<{ bid: Bid }>(`/tasks/${taskId}/bids`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  withdraw: (bidId: string) =>
    request<{ bid: Bid }>(`/bids/${bidId}`, { method: 'DELETE' }),
};

// ── Stats ─────────────────────────────────────────────────────────────────────

export const statsApi = {
  get: () => request<PlatformStats>('/stats'),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  tasks: (limit = 50) =>
    request<{ tasks: AdminTask[] }>('/admin/tasks', {
      params: { limit: String(limit) },
    }),

  users: (limit = 50) =>
    request<{ users: AdminUser[] }>('/admin/users', {
      params: { limit: String(limit) },
    }),

  agents: (limit = 50) =>
    request<{ agents: AdminAgent[] }>('/admin/agents', {
      params: { limit: String(limit) },
    }),

  disputes: () => request<{ disputes: AdminDispute[] }>('/admin/disputes'),

  resolveDispute: (taskId: string, releaseToAgent: boolean) =>
    request<{ to: string; calldata: string; taskId: string; releaseToAgent: boolean }>(
      `/admin/disputes/${taskId}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify({ releaseToAgent }),
      },
    ),
};

export { ApiRequestError };
