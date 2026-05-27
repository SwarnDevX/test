"use client";

import type { LanguageStat } from "@/types/stats";

const LANG_COLORS: Record<string, string> = {
  java:       "bg-amber-500",
  python:     "bg-blue-400",
  cpp:        "bg-purple-500",
  c:          "bg-indigo-400",
  javascript: "bg-yellow-400",
  go:         "bg-cyan-400",
  rust:       "bg-orange-500",
};

interface Props { data: LanguageStat[] }

export function LanguageBar({ data }: Props) {
  if (!data.length) return (
    <p className="text-xs text-zinc-500">No accepted submissions yet</p>
  );

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {data.map(l => (
          <div key={l.language}
            className={`${LANG_COLORS[l.language] ?? "bg-zinc-500"} transition-all`}
            style={{ width: `${l.percentage}%` }}
            title={`${l.language}: ${l.percentage}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.map(l => (
          <div key={l.language} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${LANG_COLORS[l.language] ?? "bg-zinc-500"}`} />
            <span className="text-zinc-300 capitalize">{l.language}</span>
            <span className="text-zinc-500">{l.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
