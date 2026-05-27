"use client";

import { type EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from "@xyflow/react";
import { memo } from "react";

export const AnimatedEdge = memo(function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
  style,
}: EdgeProps & { data?: { label?: string; condition?: string; animated?: boolean } }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const strokeColor = selected
    ? "oklch(65% 0.18 240)"
    : "oklch(55% 0.01 260 / 0.6)";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? 2 : 1.5,
          ...style,
        }}
      />

      {/* Animated particle on edge when active */}
      <path
        d={edgePath}
        fill="none"
        stroke="oklch(65% 0.18 240)"
        strokeWidth={2}
        strokeDasharray="6 18"
        strokeLinecap="round"
        className="react-flow__edge-path"
        style={{
          opacity: selected ? 0.5 : 0,
          animation: selected ? "flow-particle 1.5s linear infinite" : undefined,
        }}
      />

      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <span className="px-1.5 py-0.5 rounded-md bg-bg-surface-3 border border-border/60 text-[10px] text-fg-muted font-medium">
              {data.label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
