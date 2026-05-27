"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Brain, Sparkles, Search, Scissors, FileText, Cpu, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExecutionStore } from "@/stores/execution.store";

const AI_ICONS: Record<string, React.ReactNode> = {
  "ai.chatCompletion": <Brain className="w-4 h-4" />,
  "ai.embeddings": <Sparkles className="w-4 h-4" />,
  "ai.vectorSearch": <Search className="w-4 h-4" />,
  "ai.textSplitter": <Scissors className="w-4 h-4" />,
  "ai.documentLoader": <FileText className="w-4 h-4" />,
  "ai.structuredOutput": <Cpu className="w-4 h-4" />,
  "ai.imageGeneration": <Image className="w-4 h-4" />,
};

const AI_COLOR = "oklch(65% 0.18 240)";

interface AINodeData {
  type: string;
  label: string;
  config: Record<string, unknown>;
  isMuted?: boolean;
}

export const AINode = memo(function AINode({ id, data, selected }: NodeProps & { data: AINodeData }) {
  const nodeStatus = useExecutionStore((s) => s.getNodeStatus(id));
  const icon = AI_ICONS[data.type] ?? <Brain className="w-4 h-4" />;
  const nodeExec = useExecutionStore((s) => s.activeRun?.nodes[id]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.15 }}
      className={cn(
        "relative min-w-[200px] max-w-[280px] rounded-xl border bg-bg-surface-2 shadow-md transition-all",
        selected ? "border-accent/60 shadow-glow" : "border-border/60 hover:border-border",
        nodeStatus === "running" && "ring-2 ring-accent ring-offset-1 ring-offset-bg-base",
        nodeStatus === "success" && "ring-2 ring-success ring-offset-1 ring-offset-bg-base",
        nodeStatus === "failed" && "ring-2 ring-danger ring-offset-1 ring-offset-bg-base",
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: AI_COLOR, width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
      />

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border/40"
        style={{ background: `linear-gradient(135deg, ${AI_COLOR}25 0%, ${AI_COLOR}08 100%)` }}
      >
        <div style={{ color: AI_COLOR }}>{icon}</div>
        <span className="text-xs font-semibold flex-1 truncate">{data.label}</span>
        {nodeStatus === "running" && (
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-accent animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-2 space-y-1.5">
        {!!data.config.model && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-muted">Model</span>
            <span className="text-xs font-mono text-fg">{String(data.config.model)}</span>
          </div>
        )}
        {data.config.temperature !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-muted">Temp</span>
            <span className="text-xs font-mono text-fg">{String(data.config.temperature)}</span>
          </div>
        )}

        {/* Live streaming buffer */}
        {nodeStatus === "running" && nodeExec?.streamBuffer != null && (
          <div className="mt-2 p-2 rounded-md bg-bg-surface-3 text-xs text-fg-muted line-clamp-3 font-mono">
            {String(nodeExec.streamBuffer)}
            <span className="inline-block w-1 h-3 bg-accent/60 animate-pulse align-bottom ml-0.5" />
          </div>
        )}

        {/* Output preview */}
        {nodeStatus === "success" && nodeExec?.outputData?.text != null && (
          <div className="mt-2 p-2 rounded-md bg-success/5 border border-success/20 text-xs text-fg-muted line-clamp-2">
            {String(nodeExec.outputData.text).slice(0, 120)}…
          </div>
        )}

        {nodeStatus === "success" && nodeExec?.tokens && (
          <div className="flex items-center gap-2 text-xs text-fg-muted/60">
            <span>{nodeExec.tokens.toLocaleString()} tokens</span>
            {nodeExec.costUsd && <span>${nodeExec.costUsd.toFixed(4)}</span>}
          </div>
        )}
      </div>

      {/* Output handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ top: "33%", background: AI_COLOR, width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
        title="output (ANY)"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="error"
        style={{ top: "67%", background: "oklch(62% 0.22 25)", width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
        title="error (STRING)"
      />
    </motion.div>
  );
});
