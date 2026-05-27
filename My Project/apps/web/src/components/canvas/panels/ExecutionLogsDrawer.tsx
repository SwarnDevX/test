"use client";

import { useRef, useEffect } from "react";
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";
import { useExecutionStore } from "@/stores/execution.store";
import { useUIStore } from "@/stores/ui.store";
import { formatDuration, cn } from "@/lib/utils";

const LEVEL_ICONS = {
  info: <Info className="w-3 h-3 text-accent flex-shrink-0" />,
  warn: <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />,
  error: <XCircle className="w-3 h-3 text-danger flex-shrink-0" />,
};

export function ExecutionLogsDrawer() {
  const activeRun = useExecutionStore((s) => s.activeRun);
  const toggleExecutionLogs = useUIStore((s) => s.toggleExecutionLogs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRun?.logs.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-bg-surface-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Execution logs</span>
          {activeRun && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                activeRun.status === "running" && "bg-accent/10 text-accent",
                activeRun.status === "success" && "bg-success/10 text-success",
                activeRun.status === "failed" && "bg-danger/10 text-danger",
              )}
            >
              {activeRun.status}
            </span>
          )}
          {activeRun?.durationMs && (
            <span className="text-[10px] text-fg-muted">{formatDuration(activeRun.durationMs)}</span>
          )}
        </div>
        <button onClick={toggleExecutionLogs} className="text-fg-muted hover:text-fg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-0.5">
        {!activeRun ? (
          <div className="flex items-center justify-center h-full text-fg-muted">
            No active execution
          </div>
        ) : (
          <>
            {activeRun.logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-bg-surface-2 transition-colors">
                {LEVEL_ICONS[log.level]}
                <span className="text-fg-muted/60 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
                {log.nodeId && (
                  <span className="text-accent/70 flex-shrink-0 truncate max-w-[80px]">[{log.nodeId.slice(-6)}]</span>
                )}
                <span className={cn(
                  "flex-1 break-all",
                  log.level === "error" ? "text-danger" : log.level === "warn" ? "text-warning" : "text-fg-muted",
                )}>
                  {log.message}
                </span>
              </div>
            ))}

            {/* Node statuses summary */}
            {Object.keys(activeRun.nodes).length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/40 grid grid-cols-2 gap-1">
                {Object.entries(activeRun.nodes).map(([nodeId, exec]) => (
                  <div key={nodeId} className="flex items-center gap-1.5 px-2 py-1 rounded">
                    {exec.status === "success" ? (
                      <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                    ) : exec.status === "failed" ? (
                      <XCircle className="w-3 h-3 text-danger flex-shrink-0" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-accent border-t-transparent animate-spin flex-shrink-0" />
                    )}
                    <span className="text-[10px] text-fg-muted truncate">{nodeId.slice(-8)}</span>
                    {exec.durationMs && <span className="text-[10px] text-fg-muted/60 ml-auto">{formatDuration(exec.durationMs)}</span>}
                  </div>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
}
