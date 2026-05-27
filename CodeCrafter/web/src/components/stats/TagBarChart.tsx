"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { TagStat } from "@/types/stats";

interface Props { data: TagStat[] }

export function TagBarChart({ data }: Props) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={data.length * 28 + 20}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="tag" width={130}
          tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, fontSize: 12 }}
          itemStyle={{ color: "#e4e4e7" }}
          formatter={(v) => [v, "Solved"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
          {data.map((_, i) => (
            <Cell key={i} fill="#10b981" fillOpacity={1 - i * 0.06} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
