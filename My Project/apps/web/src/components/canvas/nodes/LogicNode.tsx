"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { GitBranch, Filter, Merge, RefreshCcw, Timer, Variable, Hash, Code } from "lucide-react";
import { cn } from "@/lib/utils";

const LOGIC_ICONS: Record<string, React.ReactNode> = {
  "logic.ifElse": <GitBranch className="w-4 h-4" />,
  "logic.switch": <GitBranch className="w-4 h-4" />,
  "logic.merge": <Merge className="w-4 h-4" />,
  "logic.filter": <Filter className="w-4 h-4" />,
  "logic.loop": <RefreshCcw className="w-4 h-4" />,
  "logic.wait": <Timer className="w-4 h-4" />,
  "logic.setVariable": <Variable className="w-4 h-4" />,
  "logic.math": <Hash className="w-4 h-4" />,
  "logic.jsonManipulator": <Code className="w-4 h-4" />,
};

const LOGIC_COLOR = "oklch(80% 0.18 85)";

interface LogicNodeData {
  type: string;
  label: string;
  config: Record<string, unknown>;
  isMuted?: boolean;
}

export const LogicNode = memo(function LogicNode({ id, data, selected }: NodeProps & { data: LogicNodeData }) {
  const icon = LOGIC_ICONS[data.type] ?? <GitBranch className="w-4 h-4" />;
  const isBranching = ["logic.ifElse", "logic.switch"].includes(data.type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.15 }}
      className={cn(
        "relative min-w-[160px] rounded-xl border bg-bg-surface-2 shadow-md transition-all",
        selected ? "border-accent/60" : "border-border/60 hover:border-border",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: LOGIC_COLOR, width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
      />

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border/40"
        style={{ background: `linear-gradient(135deg, ${LOGIC_COLOR}20 0%, ${LOGIC_COLOR}08 100%)` }}
      >
        <div style={{ color: LOGIC_COLOR }}>{icon}</div>
        <span className="text-xs font-semibold">{data.label}</span>
      </div>

      <div className="px-3 py-2 text-xs text-fg-muted">
        {data.type === "logic.ifElse" && !!data.config.condition && (
          <span className="font-mono truncate block">{String(data.config.condition)}</span>
        )}
        {data.type === "logic.wait" && !!data.config.durationMs && (
          <span>{Number(data.config.durationMs) / 1000}s delay</span>
        )}
        {data.type === "logic.setVariable" && !!data.config.variableName && (
          <span className="font-mono">{String(data.config.variableName)}</span>
        )}
      </div>

      {isBranching ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "33%", background: "oklch(72% 0.17 145)", width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
            title="true"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "67%", background: "oklch(62% 0.22 25)", width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
            title="false"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          style={{ background: LOGIC_COLOR, width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
        />
      )}
    </motion.div>
  );
});
