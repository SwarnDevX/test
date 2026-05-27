import { create } from "zustand";
import type { ExecutionEvent } from "@flowforge/shared";

export type NodeStatus = "idle" | "running" | "success" | "failed" | "muted" | "skipped";

export interface NodeExecution {
  nodeId: string;
  status: NodeStatus;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  error?: string;
  tokens?: number;
  costUsd?: number;
  streamBuffer?: string;
  retryAttempt?: number;
}

export interface ExecutionRun {
  id: string;
  workflowId: string;
  status: "idle" | "running" | "success" | "failed" | "cancelled";
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  totalTokens?: number;
  totalCostUsd?: number;
  error?: string;
  nodes: Record<string, NodeExecution>;
  logs: Array<{ timestamp: number; level: "info" | "warn" | "error"; message: string; nodeId?: string }>;
}

interface ExecutionState {
  activeRun: ExecutionRun | null;
  history: ExecutionRun[];

  startRun: (executionId: string, workflowId: string) => void;
  applyEvent: (event: ExecutionEvent) => void;
  clearRun: () => void;
  getNodeStatus: (nodeId: string) => NodeStatus;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  activeRun: null,
  history: [],

  startRun: (executionId, workflowId) =>
    set({
      activeRun: {
        id: executionId,
        workflowId,
        status: "running",
        startedAt: Date.now(),
        nodes: {},
        logs: [],
      },
    }),

  applyEvent: (event: ExecutionEvent) =>
    set((s) => {
      if (!s.activeRun) return s;
      const run = { ...s.activeRun };
      const nodes = { ...run.nodes };
      const logs = [...run.logs];

      switch (event.type) {
        case "execution_start":
          run.status = "running";
          run.startedAt = event.timestamp;
          break;

        case "execution_done":
          run.status = "success";
          run.completedAt = event.timestamp;
          run.durationMs = event.durationMs;
          run.totalTokens = event.totalTokens;
          run.totalCostUsd = event.totalCostUsd;
          logs.push({ timestamp: event.timestamp, level: "info", message: `Execution completed in ${event.durationMs}ms` });
          break;

        case "execution_error":
          run.status = "failed";
          run.error = event.error;
          logs.push({ timestamp: event.timestamp, level: "error", message: `Execution failed: ${event.error}` });
          break;

        case "node_start":
          nodes[event.nodeId] = {
            nodeId: event.nodeId,
            status: "running",
            startedAt: event.timestamp,
            inputData: event.inputData as Record<string, unknown> | undefined,
          };
          logs.push({ timestamp: event.timestamp, level: "info", message: `[${event.nodeType}] Started`, nodeId: event.nodeId });
          break;

        case "node_output":
          if (nodes[event.nodeId]) {
            nodes[event.nodeId] = { ...nodes[event.nodeId]!, outputData: event.outputData as Record<string, unknown> };
          }
          break;

        case "node_stream":
          if (nodes[event.nodeId]) {
            const prev = nodes[event.nodeId]!;
            nodes[event.nodeId] = { ...prev, streamBuffer: (prev.streamBuffer ?? "") + event.chunk };
          }
          break;

        case "node_done":
          if (nodes[event.nodeId]) {
            nodes[event.nodeId] = {
              ...nodes[event.nodeId]!,
              status: event.status === "success" ? "success" : "failed",
              completedAt: event.timestamp,
              durationMs: event.durationMs,
            };
          }
          logs.push({
            timestamp: event.timestamp,
            level: event.status === "success" ? "info" : "error",
            message: `[Node] ${event.status} (${event.durationMs}ms)`,
            nodeId: event.nodeId,
          });
          break;

        case "node_error":
          if (nodes[event.nodeId]) {
            nodes[event.nodeId] = {
              ...nodes[event.nodeId]!,
              status: "failed",
              error: event.error,
              retryAttempt: event.retryAttempt,
            };
          }
          logs.push({ timestamp: event.timestamp, level: "error", message: `[Node] Error: ${event.error}`, nodeId: event.nodeId });
          break;

        case "node_muted":
          nodes[event.nodeId] = { nodeId: event.nodeId, status: "muted" };
          break;
      }

      run.nodes = nodes;
      run.logs = logs;
      return { activeRun: run };
    }),

  clearRun: () =>
    set((s) => ({
      history: s.activeRun ? [s.activeRun, ...s.history].slice(0, 20) : s.history,
      activeRun: null,
    })),

  getNodeStatus: (nodeId) => get().activeRun?.nodes[nodeId]?.status ?? "idle",
}));
