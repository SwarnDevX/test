"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play, Save, Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  Layout, MoreHorizontal, Loader2, CheckCircle2, GitBranch,
  PanelLeft, PanelRight, Terminal, Map
} from "lucide-react";
import { useWorkflowStore } from "@/stores/workflow.store";
import { useUIStore } from "@/stores/ui.store";
import { useExecutionStore } from "@/stores/execution.store";
import { trpc } from "@/lib/trpc";
import { connectSocket, joinExecutionRoom } from "@/lib/socket";
import { formatRelative, cn } from "@/lib/utils";

interface CanvasToolbarProps {
  workflowId: string;
}

export function CanvasToolbar({ workflowId }: CanvasToolbarProps) {
  const meta = useWorkflowStore((s) => s.meta);
  const isDirty = useWorkflowStore((s) => s.isDirty);
  const isSaving = useWorkflowStore((s) => s.isSaving);
  const markSaved = useWorkflowStore((s) => s.markSaved);
  const setIsSaving = useWorkflowStore((s) => s.setIsSaving);
  const toDefinition = useWorkflowStore((s) => s.toDefinition);
  const lastSavedAt = useWorkflowStore((s) => s.lastSavedAt);

  const undo = () => {};
  const redo = () => {};
  const canUndo = false;
  const canRedo = false;

  const {
    nodeLibraryOpen, setNodeLibraryOpen,
    inspectorOpen, setInspectorOpen,
    executionLogsOpen, toggleExecutionLogs,
    minimapVisible, setMinimapVisible,
  } = useUIStore();

  const activeRun = useExecutionStore((s) => s.activeRun);
  const startRun = useExecutionStore((s) => s.startRun);
  const clearRun = useExecutionStore((s) => s.clearRun);

  const updateMutation = trpc.workflow.update.useMutation({
    onMutate: () => setIsSaving(true),
    onSuccess: () => { markSaved(); setIsSaving(false); },
    onError: () => setIsSaving(false),
  });

  const runMutation = trpc.execution.run.useMutation({
    onSuccess: (data) => {
      startRun(data.id, workflowId);
      connectSocket();
      joinExecutionRoom(data.id);
    },
  });

  function handleSave() {
    const definition = toDefinition();
    updateMutation.mutate({ id: workflowId, definition });
  }

  function handleRun() {
    runMutation.mutate({ workflowId });
  }

  const isRunning = activeRun?.status === "running";

  return (
    <div className="h-12 border-b border-border/60 bg-bg-surface-1 flex items-center px-3 gap-2 flex-shrink-0">
      {/* Left: title */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <GitBranch className="w-4 h-4 text-fg-muted flex-shrink-0" />
        <span className="font-medium text-sm truncate">{meta?.name ?? "Untitled"}</span>
        {isDirty && (
          <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" title="Unsaved changes" />
        )}
      </div>

      {/* Center: actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => undo()}
          disabled={!canUndo}
          className="p-1.5 rounded hover:bg-bg-surface-2 text-fg-muted hover:text-fg disabled:opacity-30 transition-colors"
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => redo()}
          disabled={!canRedo}
          className="p-1.5 rounded hover:bg-bg-surface-2 text-fg-muted hover:text-fg disabled:opacity-30 transition-colors"
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-border/60 mx-1" />

        <button
          onClick={() => setNodeLibraryOpen(!nodeLibraryOpen)}
          className={cn(
            "p-1.5 rounded transition-colors",
            nodeLibraryOpen ? "bg-accent/10 text-accent" : "hover:bg-bg-surface-2 text-fg-muted hover:text-fg",
          )}
          title="Node library"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setInspectorOpen(!inspectorOpen)}
          className={cn(
            "p-1.5 rounded transition-colors",
            inspectorOpen ? "bg-accent/10 text-accent" : "hover:bg-bg-surface-2 text-fg-muted hover:text-fg",
          )}
          title="Inspector panel"
        >
          <PanelRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={toggleExecutionLogs}
          className={cn(
            "p-1.5 rounded transition-colors",
            executionLogsOpen ? "bg-accent/10 text-accent" : "hover:bg-bg-surface-2 text-fg-muted hover:text-fg",
          )}
          title="Execution logs"
        >
          <Terminal className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setMinimapVisible(!minimapVisible)}
          className={cn(
            "p-1.5 rounded transition-colors",
            minimapVisible ? "bg-accent/10 text-accent" : "hover:bg-bg-surface-2 text-fg-muted hover:text-fg",
          )}
          title="Minimap"
        >
          <Map className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: save + run */}
      <div className="flex items-center gap-2">
        {lastSavedAt && !isDirty && (
          <span className="text-xs text-fg-muted hidden sm:block">
            Saved {formatRelative(lastSavedAt)}
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
            isDirty
              ? "bg-bg-surface-2 hover:bg-bg-surface-3 text-fg border border-border/60"
              : "text-fg-muted cursor-default",
          )}
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isDirty ? (
            <Save className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          {isDirty ? "Save" : "Saved"}
        </button>

        <button
          onClick={isRunning ? undefined : handleRun}
          disabled={runMutation.isPending}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-[0.97]",
            isRunning
              ? "bg-warning/10 border border-warning/30 text-warning"
              : "bg-accent hover:bg-accent-hover text-white shadow-glow",
          )}
        >
          {runMutation.isPending || isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {isRunning ? "Running…" : "Run"}
        </button>
      </div>
    </div>
  );
}
