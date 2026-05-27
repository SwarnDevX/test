"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Terminal, FileCode, FileType } from "lucide-react";
import { cn } from "@/lib/utils";

const CODE_ICONS: Record<string, React.ReactNode> = {
  "code.javascript": <Terminal className="w-4 h-4" />,
  "code.python": <FileCode className="w-4 h-4" />,
  "code.template": <FileType className="w-4 h-4" />,
};

const CODE_COLOR = "oklch(65% 0.15 180)";

interface CodeNodeData {
  type: string;
  label: string;
  config: Record<string, unknown>;
  isMuted?: boolean;
}

export const CodeNode = memo(function CodeNode({ id, data, selected }: NodeProps & { data: CodeNodeData }) {
  const icon = CODE_ICONS[data.type] ?? <Terminal className="w-4 h-4" />;
  const codePreview = typeof data.config.code === "string"
    ? data.config.code.split("\n").slice(0, 2).join("\n")
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.15 }}
      className={cn(
        "relative min-w-[200px] max-w-[260px] rounded-xl border bg-bg-surface-2 shadow-md transition-all",
        selected ? "border-accent/60" : "border-border/60 hover:border-border",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: CODE_COLOR, width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
      />

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b border-border/40"
        style={{ background: `linear-gradient(135deg, ${CODE_COLOR}20 0%, ${CODE_COLOR}08 100%)` }}
      >
        <div style={{ color: CODE_COLOR }}>{icon}</div>
        <span className="text-xs font-semibold">{data.label}</span>
        <span
          className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-bg-surface-3 font-mono text-fg-muted"
        >
          {data.type === "code.javascript" ? "JS" : data.type === "code.python" ? "PY" : "TPL"}
        </span>
      </div>

      {codePreview && (
        <div className="px-3 py-2">
          <pre className="text-[10px] font-mono text-fg-muted line-clamp-2 overflow-hidden">
            {codePreview}
          </pre>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: CODE_COLOR, width: 10, height: 10, border: "2px solid oklch(18% 0.02 260)" }}
      />
    </motion.div>
  );
});
