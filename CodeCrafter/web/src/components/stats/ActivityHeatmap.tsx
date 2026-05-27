"use client";

import { useState, useMemo } from "react";
import type { HeatmapEntry } from "@/types/stats";

interface Props {
  data: HeatmapEntry[];
}

const CELL = 12;
const GAP  = 2;
const STEP = CELL + GAP;

const COLORS = [
  "fill-zinc-800",           // 0
  "fill-emerald-900",        // 1
  "fill-emerald-700",        // 2-3
  "fill-emerald-500",        // 4-7
  "fill-emerald-400",        // 8+
];

function intensity(count: number) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3)  return 2;
  if (count <= 7)  return 3;
  return 4;
}

const DAY_LABELS = ["Sun", "", "Tue", "", "Thu", "", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function ActivityHeatmap({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  // Build a map date→count for fast lookup
  const countMap = useMemo(() => {
    const m = new Map<string, number>();
    data.forEach(e => m.set(e.date, e.count));
    return m;
  }, [data]);

  // Build week columns starting from 52 weeks ago (Sunday-aligned)
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the Sunday on or before 364 days ago
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay()); // back to Sunday

    const cols: Array<Array<{ dateStr: string; count: number }>> = [];
    const cur = new Date(start);

    while (cur <= today) {
      const week: Array<{ dateStr: string; count: number }> = [];
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(cur);
        d.setDate(d.getDate() + dow);
        const iso = d.toISOString().slice(0, 10);
        week.push({ dateStr: iso, count: d <= today ? (countMap.get(iso) ?? 0) : -1 });
      }
      cols.push(week);
      cur.setDate(cur.getDate() + 7);
    }
    return cols;
  }, [countMap]);

  // Month labels: find the week where month changes
  const monthLabels = useMemo(() => {
    const labels: Array<{ col: number; label: string }> = [];
    let lastMonth = -1;
    weeks.forEach((week, colIdx) => {
      const m = new Date(week[0].dateStr).getMonth();
      if (m !== lastMonth) {
        labels.push({ col: colIdx, label: MONTHS[m] });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  const totalAc = useMemo(() => data.reduce((s, e) => s + e.count, 0), [data]);

  const svgW = weeks.length * STEP + 28; // 28 = day-label col
  const svgH = 7 * STEP + 20;            // 20 = month label row

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-between mb-2 text-xs text-zinc-500">
        <span>{totalAc} submissions in the last year</span>
        <span className="flex items-center gap-1">
          Less
          {[0,1,2,3,4].map(i => (
            <svg key={i} width={CELL} height={CELL}>
              <rect width={CELL} height={CELL} rx={2} className={COLORS[i]} />
            </svg>
          ))}
          More
        </span>
      </div>

      <div className="relative">
        <svg width={svgW} height={svgH} className="overflow-visible">
          {/* Month labels */}
          {monthLabels.map(({ col, label }) => (
            <text key={col} x={28 + col * STEP} y={10}
              className="fill-zinc-500" fontSize={10} fontFamily="inherit">
              {label}
            </text>
          ))}

          {/* Day-of-week labels */}
          {DAY_LABELS.map((label, dow) => label && (
            <text key={dow} x={0} y={20 + dow * STEP + CELL * 0.8}
              className="fill-zinc-500" fontSize={9} fontFamily="inherit">
              {label}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, colIdx) =>
            week.map((cell, dow) => {
              if (cell.count === -1) return null; // future date
              const x = 28 + colIdx * STEP;
              const y = 20 + dow * STEP;
              return (
                <rect key={`${colIdx}-${dow}`}
                  x={x} y={y} width={CELL} height={CELL} rx={2}
                  className={`${COLORS[intensity(cell.count)]} cursor-pointer transition-opacity hover:opacity-80`}
                  onMouseEnter={e => setTooltip({
                    x: e.clientX, y: e.clientY,
                    date: cell.dateStr, count: cell.count,
                  })}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })
          )}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div className="fixed z-50 pointer-events-none px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded shadow-lg text-zinc-100"
            style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}>
            <span className="font-semibold">{tooltip.count} AC</span>
            {" on "}
            {new Date(tooltip.date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric", year: "numeric",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
