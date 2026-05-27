import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Node, Edge, NodeChange, EdgeChange, Connection, Viewport } from "@xyflow/react";
import type { WorkflowDefinition } from "@flowforge/shared";

export interface CanvasNode extends Node {
  data: {
    type: string;
    label: string;
    config: Record<string, unknown>;
    isMuted?: boolean;
    retryPolicy?: {
      maxAttempts: number;
      baseDelay: number;
      maxDelay: number;
      onError: "stop" | "continue";
    };
    description?: string;
  };
}

export interface CanvasEdge extends Edge {
  data?: {
    label?: string;
    condition?: string;
  };
}

interface WorkflowMeta {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  workspaceId: string;
  updatedAt: string;
}

interface WorkflowState {
  meta: WorkflowMeta | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: Viewport;
  selectedNodeIds: string[];
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  variables: Record<string, unknown>;

  // Actions
  setMeta: (meta: WorkflowMeta) => void;
  loadDefinition: (def: WorkflowDefinition, meta: WorkflowMeta) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: CanvasNode) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  toggleNodeMute: (nodeId: string) => void;
  deleteSelectedNodes: () => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setViewport: (viewport: Viewport) => void;
  setIsSaving: (v: boolean) => void;
  markSaved: () => void;
  setVariable: (key: string, value: unknown) => void;
  toDefinition: () => WorkflowDefinition;
}

import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";

export const useWorkflowStore = create<WorkflowState>()(
  immer((set, get) => ({
      meta: null,
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedNodeIds: [],
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
      variables: {},

      setMeta: (meta) =>
        set((s) => {
          s.meta = meta;
        }),

      loadDefinition: (def, meta) =>
        set((s) => {
          s.meta = meta;
          s.nodes = def.nodes as CanvasNode[];
          s.edges = def.edges as CanvasEdge[];
          s.isDirty = false;
          s.lastSavedAt = meta.updatedAt;
        }),

      onNodesChange: (changes) =>
        set((s) => {
          s.nodes = applyNodeChanges(changes, s.nodes) as CanvasNode[];
          s.isDirty = true;
        }),

      onEdgesChange: (changes) =>
        set((s) => {
          s.edges = applyEdgeChanges(changes, s.edges) as CanvasEdge[];
          s.isDirty = true;
        }),

      onConnect: (connection) =>
        set((s) => {
          s.edges = addEdge(
            {
              ...connection,
              id: `e-${connection.source}-${connection.target}-${Date.now()}`,
              animated: false,
              type: "animated",
            },
            s.edges,
          ) as CanvasEdge[];
          s.isDirty = true;
        }),

      addNode: (node) =>
        set((s) => {
          s.nodes.push(node);
          s.isDirty = true;
        }),

      updateNodeConfig: (nodeId, config) =>
        set((s) => {
          const node = s.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.data.config = { ...node.data.config, ...config };
            s.isDirty = true;
          }
        }),

      updateNodeLabel: (nodeId, label) =>
        set((s) => {
          const node = s.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.data.label = label;
            s.isDirty = true;
          }
        }),

      toggleNodeMute: (nodeId) =>
        set((s) => {
          const node = s.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.data.isMuted = !node.data.isMuted;
            s.isDirty = true;
          }
        }),

      deleteSelectedNodes: () =>
        set((s) => {
          const ids = new Set(s.selectedNodeIds);
          s.nodes = s.nodes.filter((n) => !ids.has(n.id));
          s.edges = s.edges.filter((e) => !ids.has(e.source) && !ids.has(e.target));
          s.selectedNodeIds = [];
          s.isDirty = true;
        }),

      setSelectedNodeIds: (ids) =>
        set((s) => {
          s.selectedNodeIds = ids;
        }),

      setViewport: (viewport) =>
        set((s) => {
          s.viewport = viewport;
        }),

      setIsSaving: (isSaving) =>
        set((s) => {
          s.isSaving = isSaving;
        }),

      markSaved: () =>
        set((s) => {
          s.isDirty = false;
          s.lastSavedAt = new Date().toISOString();
        }),

      setVariable: (key, value) =>
        set((s) => {
          s.variables[key] = value;
        }),

      toDefinition: (): WorkflowDefinition => {
        const { nodes, edges, meta } = get();
        return {
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.data.type,
            position: n.position,
            data: n.data as any,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? undefined,
            targetHandle: e.targetHandle ?? undefined,
            label: (e.data as { label?: string } | undefined)?.label,
            condition: (e.data as { condition?: string } | undefined)?.condition,
          })),
          viewport: get().viewport,
        };
      },
  })),
);
