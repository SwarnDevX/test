"use client";

import { use, useEffect } from "react";
import { notFound } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { trpc } from "@/lib/trpc";
import { useWorkflowStore } from "@/stores/workflow.store";
import { useExecutionSocket } from "@/hooks/useSocket";
import { useExecutionStore } from "@/stores/execution.store";
import { FlowCanvas } from "@/components/canvas/FlowCanvas";

function WorkflowEditor({ id }: { id: string }) {
  const { data: workflow, isLoading, error } = trpc.workflow.get.useQuery({ id });
  const loadDefinition = useWorkflowStore((s) => s.loadDefinition);
  const activeRun = useExecutionStore((s) => s.activeRun);

  useExecutionSocket(activeRun?.id ?? null);

  useEffect(() => {
    if (workflow) {
      loadDefinition(workflow.definition as any, {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description ?? "",
        isActive: workflow.isActive,
        workspaceId: workflow.workspaceId,
        updatedAt: workflow.updatedAt.toISOString(),
      });
    }
  }, [workflow, loadDefinition]);

  if (error) return notFound();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-fg-muted">Loading workflow…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-hidden">
      <FlowCanvas workflowId={id} />
    </div>
  );
}

export default function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  if (id === "new") {
    return (
      <div className="flex-1 h-full overflow-hidden">
        <ReactFlowProvider>
          <FlowCanvas workflowId="new" />
        </ReactFlowProvider>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <WorkflowEditor id={id} />
    </ReactFlowProvider>
  );
}
