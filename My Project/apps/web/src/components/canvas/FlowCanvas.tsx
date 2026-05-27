"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeParams,
  SelectionMode,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "@/stores/workflow.store";
import { useUIStore } from "@/stores/ui.store";
import { TriggerNode } from "./nodes/TriggerNode";
import { AINode } from "./nodes/AINode";
import { LogicNode } from "./nodes/LogicNode";
import { CodeNode } from "./nodes/CodeNode";
import { IntegrationNode } from "./nodes/IntegrationNode";
import { BaseNode } from "./nodes/BaseNode";
import { AnimatedEdge } from "./edges/AnimatedEdge";
import { NodeLibraryPanel } from "./panels/NodeLibraryPanel";
import { InspectorPanel } from "./panels/InspectorPanel";
import { ExecutionLogsDrawer } from "./panels/ExecutionLogsDrawer";
import { CanvasToolbar } from "./toolbar/CanvasToolbar";

const nodeTypes: NodeTypes = {
  "trigger.manual": TriggerNode as never,
  "trigger.webhook": TriggerNode as never,
  "trigger.schedule": TriggerNode as never,
  "trigger.chat-message": TriggerNode as never,
  "ai.chatCompletion": AINode as never,
  "ai.embeddings": AINode as never,
  "ai.vectorSearch": AINode as never,
  "ai.textSplitter": AINode as never,
  "ai.documentLoader": AINode as never,
  "ai.structuredOutput": AINode as never,
  "ai.imageGeneration": AINode as never,
  "logic.ifElse": LogicNode as never,
  "logic.switch": LogicNode as never,
  "logic.merge": LogicNode as never,
  "logic.filter": LogicNode as never,
  "logic.loop": LogicNode as never,
  "logic.wait": LogicNode as never,
  "logic.setVariable": LogicNode as never,
  "logic.math": LogicNode as never,
  "logic.jsonManipulator": LogicNode as never,
  "code.javascript": CodeNode as never,
  "code.python": CodeNode as never,
  "code.template": CodeNode as never,
  default: BaseNode as never,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge as never,
  default: AnimatedEdge as never,
};

export function FlowCanvas({ workflowId }: { workflowId: string }) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const setSelectedNodeIds = useWorkflowStore((s) => s.setSelectedNodeIds);
  const setViewport = useWorkflowStore((s) => s.setViewport);

  const { minimapVisible, nodeLibraryOpen, inspectorOpen, executionLogsOpen } = useUIStore();

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      setSelectedNodeIds(selectedNodes.map((n) => n.id));
    },
    [setSelectedNodeIds],
  );

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className="relative flex h-full overflow-hidden bg-bg-base">
      {/* Left panel — node library */}
      {nodeLibraryOpen && (
        <div className="w-64 flex-shrink-0 border-r border-border/60 z-10">
          <NodeLibraryPanel />
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <CanvasToolbar workflowId={workflowId} />

        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onMoveEnd={(_, viewport) => setViewport(viewport)}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            proOptions={proOptions}
            selectionMode={SelectionMode.Partial}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.1}
            maxZoom={2.5}
            deleteKeyCode={["Backspace", "Delete"]}
            multiSelectionKeyCode="Shift"
            snapToGrid
            snapGrid={[8, 8]}
            defaultEdgeOptions={{
              type: "animated",
              animated: false,
            }}
          >
            <Background
              color="oklch(96% 0.005 260 / 0.06)"
              gap={20}
              size={1}
              style={{ background: "oklch(9% 0.010 260)" }}
            />
            {minimapVisible && (
              <MiniMap
                nodeColor={(node) => {
                  const type = (node.data as { type?: string }).type ?? "";
                  if (type.startsWith("trigger")) return "oklch(72% 0.17 145)";
                  if (type.startsWith("ai")) return "oklch(65% 0.18 240)";
                  if (type.startsWith("logic")) return "oklch(80% 0.18 85)";
                  if (type.startsWith("code")) return "oklch(65% 0.15 180)";
                  return "oklch(65% 0.18 300)";
                }}
                maskColor="oklch(9% 0.010 260 / 0.7)"
                position="bottom-right"
              />
            )}
            <Controls position="bottom-left" />
          </ReactFlow>

          {/* Execution logs drawer */}
          {executionLogsOpen && (
            <div className="absolute bottom-0 left-0 right-0 h-64 border-t border-border/60 bg-bg-surface-1 z-20">
              <ExecutionLogsDrawer />
            </div>
          )}
        </div>
      </div>

      {/* Right panel — inspector */}
      {inspectorOpen && (
        <div className="w-72 flex-shrink-0 border-l border-border/60 z-10">
          <InspectorPanel />
        </div>
      )}
    </div>
  );
}
