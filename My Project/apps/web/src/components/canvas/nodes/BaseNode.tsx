"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { VolumeX, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExecutionStore } from "@/stores/execution.store";
import { useWorkflowStore } from "@/stores/workflow.store";
import { PORT_COLORS, type PortType } from "@flowforge/shared";

interface PortDef {
  name: string;
  label: string;
  type: PortType;
  required?: boolean;
}

export interface BaseNodeData {
  [key: string]: unknown;
  type: string;
  label: string;
  config: Record<string, unknown>;
  isMuted?: boolean;
  icon?: React.ReactNode;
  color?: string;
  inputs?: PortDef[];
  outputs?: PortDef[];
  description?: string;
  retryPolicy?: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    onError: "stop" | "continue";
  };
}

const STATUS_RING = {
  idle: "",
  running: "ring-2 ring-accent ring-offset-1 ring-offset-bg-base",
  success: "ring-2 ring-success ring-offset-1 ring-offset-bg-base",
  failed: "ring-2 ring-danger ring-offset-1 ring-offset-bg-base",
  muted: "opacity-50",
  skipped: "opacity-40",
};

interface BaseNodeProps extends NodeProps {
  data: BaseNodeData;
  children?: React.ReactNode;
}

export const BaseNode = memo(function BaseNode({ id, data, selected, children }: BaseNodeProps) {
  const nodeStatus = useExecutionStore((s) => s.getNodeStatus(id));
  const toggleMute = useWorkflowStore((s) => s.toggleNodeMute);

  const ringClass = STATUS_RING[nodeStatus];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.15 }}
      className={cn(
        "relative min-w-[180px] max-w-[260px] rounded-xl border bg-bg-surface-2 shadow-md transition-all duration-150",
        selected ? "border-accent/60 shadow-glow" : "border-border/60 hover:border-border",
        ringClass,
        data.isMuted && "opacity-50",
      )}
      style={{
        boxShadow: selected
          ? `0 0 0 1px oklch(65% 0.18 240 / 0.4), 0 0 20px oklch(65% 0.18 240 / 0.12)`
          : undefined,
      }}
    >
      {/* Input handles */}
      {data.inputs?.map((port, i) => (
        <Handle
          key={port.name}
          type="target"
          position={Position.Left}
          id={port.name}
          style={{
            top: `${((i + 1) / ((data.inputs?.length ?? 0) + 1)) * 100}%`,
            background: PORT_COLORS[port.type] ?? "oklch(65% 0.18 240)",
            width: 10,
            height: 10,
            border: "2px solid oklch(18% 0.02 260)",
          }}
          title={`${port.label} (${port.type})`}
        />
      ))}

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border/40"
        style={{
          background: data.color
            ? `linear-gradient(135deg, ${data.color}20 0%, ${data.color}08 100%)`
            : undefined,
        }}
      >
        {data.icon && (
          <div
            className="w-5 h-5 flex items-center justify-center flex-shrink-0"
            style={{ color: data.color ?? "oklch(65% 0.18 240)" }}
          >
            {data.icon}
          </div>
        )}
        <span className="text-xs font-semibold flex-1 truncate">{data.label}</span>
        {nodeStatus === "running" && (
          <RefreshCw className="w-3 h-3 text-accent animate-spin flex-shrink-0" />
        )}
        {data.isMuted && (
          <VolumeX className="w-3 h-3 text-fg-muted flex-shrink-0" />
        )}
      </div>

      {/* Content */}
      {children && <div className="px-3 py-2 text-xs text-fg-muted">{children}</div>}

      {/* Status bar */}
      {nodeStatus !== "idle" && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl transition-all",
            nodeStatus === "running" && "bg-accent animate-pulse",
            nodeStatus === "success" && "bg-success",
            nodeStatus === "failed" && "bg-danger",
          )}
        />
      )}

      {/* Output handles */}
      {data.outputs?.map((port, i) => (
        <Handle
          key={port.name}
          type="source"
          position={Position.Right}
          id={port.name}
          style={{
            top: `${((i + 1) / ((data.outputs?.length ?? 0) + 1)) * 100}%`,
            background: PORT_COLORS[port.type] ?? "oklch(65% 0.18 240)",
            width: 10,
            height: 10,
            border: "2px solid oklch(18% 0.02 260)",
          }}
          title={`${port.label} (${port.type})`}
        />
      ))}
    </motion.div>
  );
});
