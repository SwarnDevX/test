"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

const SLICES = [
  { key: "Easy",   color: "#34d399" },
  { key: "Medium", color: "#fbbf24" },
  { key: "Hard",   color: "#f87171" },
];

export function SolvedDonut({ easy, medium, hard, total }: Props) {
  const data = [
    { name: "Easy",   value: easy },
    { name: "Medium", value: medium },
    { name: "Hard",   value: hard },
  ].filter(d => d.value > 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-xs text-zinc-500">
        No problems solved yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%"
              innerRadius={36} outerRadius={52} paddingAngle={2} strokeWidth={0}>
              {data.map((_, i) => (
                <Cell key={i} fill={SLICES.find(s => s.key === data[i].name)?.color ?? "#71717a"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 12 }}
              itemStyle={{ color: "#e4e4e7" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-zinc-100">{total}</span>
          <span className="text-xs text-zinc-500">solved</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {[
          { label: "Easy",   value: easy,   color: "text-emerald-400" },
          { label: "Medium", value: medium, color: "text-amber-400" },
          { label: "Hard",   value: hard,   color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-center gap-3">
            <span className={`font-semibold w-16 ${color}`}>{label}</span>
            <span className="text-zinc-300 w-8 text-right">{value}</span>
            <span className="text-zinc-600 text-xs">
              {total > 0 ? `${Math.round(value / total * 100)}%` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
