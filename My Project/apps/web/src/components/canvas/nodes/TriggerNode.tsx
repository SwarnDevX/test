"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Zap, Webhook, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExecutionStore } from "@/stores/execution.store";

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  "trigger.manual": <Zap className="w-4 h-4" />,
  "trigger.webhook": <Webhook className="w-4 h-4" />,
  "trigger.schedule": <Calendar className="w-4 h-4" />,
  "trigger.chat-message": <MessageSquare className="w-4 h-4" />,
};

const TRIGGER_COLORS: Record<string, string> = {
  "trigger.manual": "oklch(72% 0.17 145)",
  "trigger.webhook": "oklch(65% 0.18 240)",
  "trigger.schedule": "oklch(80% 0.18 85)",
  "trigger.chat-message": "oklch(70% 0.15 300)",
};

interface TriggerNodeData {
  type: string;
  label: string;
  config: Record<string, unknown>;
  isMuted?: boolean;
}

export const TriggerNode = memo(function TriggerNode({ id, data, selected }: NodeProps & { data: TriggerNodeData }) {
  const nodeStatus = useExecutionStore((s) => s.getNodeStatus(id));
  const color = TRIGGER_COLORS[data.type] ?? "oklch(72% 0.17 145)";
  const icon = TRIGGER_ICONS[data.type] ?? <Zap className="w-4 h-4" />;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.15 }}
      className={cn(
        "relative min-w-[180px] rounded-xl border bg-bg-surface-2 shadow-md transition-all duration-150",
        selected ? "border-accent/60" : "border-border/60 hover:border-border",
        nodeStatus === "running" && "ring-2 ring-accent ring-offset-1 ring-offset-bg-base",
        nodeStatus === "success" && "ring-2 ring-success ring-offset-1 ring-offset-bg-base",
      )}
    >
      {/* Trigger badge at top */}
      <div
        className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
        style={{ background: color }}
      >
        TRIGGER
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-t-xl border-b border-border/40"
        style={{ background: `linear-gradient(135deg, ${color}25 0%, ${color}08 100%)` }}
      >
        <div style={{ color }}>{icon}</div>
        <span className="text-xs font-semibold">{data.label}</span>
      </div>

      {/* Config preview */}
      <div className="px-3 py-2 text-xs text-fg-muted">
        {data.type === "trigger.webhook" && !!data.config.path && (
          <span className="font-mono">POST {String(data.config.path)}</span>
        )}
        {data.type === "trigger.schedule" && !!data.config.cronExpression && (
          <span className="font-mono">{String(data.config.cronExpression)}</span>
        )}
        {data.type === "trigger.manual" && <span>Manual trigger</span>}
        {data.type === "trigger.chat-message" && <span>Chat message received</span>}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: color,
          width: 10,
          height: 10,
          border: "2px solid oklch(18% 0.02 260)",
        }}
      />
    </motion.div>
  );
});
