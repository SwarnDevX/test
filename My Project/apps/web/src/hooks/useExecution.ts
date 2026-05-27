"use client";

import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useWorkflowStore } from "@/stores/workflow.store";
import { useExecutionStore } from "@/stores/execution.store";
import { connectSocket, joinExecutionRoom } from "@/lib/socket";

export function useRunWorkflow(workflowId: string) {
  const toDefinition = useWorkflowStore((s) => s.toDefinition);
  const startRun = useExecutionStore((s) => s.startRun);

  const runMutation = trpc.execution.run.useMutation({
    onSuccess: (data) => {
      startRun(data.id, workflowId);
      connectSocket();
      joinExecutionRoom(data.id);
    },
  });

  const run = useCallback(() => {
    runMutation.mutate({ workflowId });
  }, [workflowId, runMutation]);

  return { run, isRunning: runMutation.isPending };
}

export function useCancelExecution() {
  const clearRun = useExecutionStore((s) => s.clearRun);
  const activeRun = useExecutionStore((s) => s.activeRun);

  const cancelMutation = trpc.execution.cancel.useMutation({
    onSuccess: () => clearRun(),
  });

  const cancel = useCallback(() => {
    if (!activeRun?.id) return;
    cancelMutation.mutate({ id: activeRun.id });
  }, [activeRun?.id, cancelMutation]);

  return { cancel };
}
