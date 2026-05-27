"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Plug, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExecutionStore } from "@/stores/execution.store";

const INTEGRATION_COLOR = "oklch(65% 0.18 300)";

interface IntegrationNodeData {
  type: string;
  label: string;
  config: Record<string, unknown>;
  isMuted?: boolean;
  iconUrl?: string;
}

export const IntegrationNode = memo(function IntegrationNode({ id, data, selected }: NodeProps & { data: IntegrationNodeData }) {
  const nodeStatus = useExecutionStore((s) => s.getNodeStatus(id));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.15 }}
      className={cn(
        "relative min-w-[180px] rounded-xl border bg-bg-surface-2 shadow-md transition-all",
        selected ? "border-accent/60" : "border-border/60 hover:border-border",
        nodeStatus === "running" && "ring-2 ring-accent ring-offset-1 ring-offset-bg-base",
        nodeStatus === "success" && "ring-2 ring-success ring-offset-1 ring-offset-bg-base",
        nodeStatus === "failed" && "ring-2 ring-danger ring-offset-1 ring-offset-bg-base",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: INTEGRATION_COLOR, width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
      />

      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-b border-border/40"
        style={{ background: `linear-gradient(135deg, ${INTEGRATION_COLOR}20 0%, ${INTEGRATION_COLOR}08 100%)` }}
      >
        <div className="w-5 h-5 flex items-center justify-center" style={{ color: INTEGRATION_COLOR }}>
          <Plug className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{data.label}</div>
          <div className="text-[10px] text-fg-muted truncate">{data.type.split(".").slice(1).join(".")}</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: INTEGRATION_COLOR, width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
      />
    </motion.div>
  );
});
