"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useWorkflowStore } from "@/stores/workflow.store";

export function useWorkflowSave(workflowId: string) {
  const toDefinition = useWorkflowStore((s) => s.toDefinition);
  const meta = useWorkflowStore((s) => s.meta);
  const setIsSaving = useWorkflowStore((s) => s.setIsSaving);
  const markSaved = useWorkflowStore((s) => s.markSaved);

  const updateMutation = trpc.workflow.update.useMutation({
    onMutate: () => setIsSaving(true),
    onSuccess: () => { markSaved(); setIsSaving(false); },
    onError: () => setIsSaving(false),
  });

  const save = useCallback(() => {
    if (!meta) return;
    updateMutation.mutate({
      id: workflowId,
      definition: toDefinition(),
    });
  }, [workflowId, meta, toDefinition, updateMutation]);

  return { save, isSaving: updateMutation.isPending };
}

export function useWorkflowCreate() {
  const router = useRouter();

  const createMutation = trpc.workflow.create.useMutation({
    onSuccess: (data) => {
      router.push(`/workflows/${data.id}`);
    },
  });

  return { create: createMutation.mutate, isCreating: createMutation.isPending };
}
