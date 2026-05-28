"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { ContestRatingHistoryDto } from "@/types/contest";

interface Props {
  username: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d: ContestRatingHistoryDto = payload[0].payload;
  const delta = d.newRating - d.oldRating;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-zinc-100 mb-1 truncate max-w-48">{d.contestTitle}</p>
      <p className="text-zinc-400">Rank #{d.rank} of {d.participantCount}</p>
      <p className={`font-medium mt-1 ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
        {d.newRating} ({delta >= 0 ? "+" : ""}{delta})
      </p>
    </div>
  );
}

export function RatingGraph({ username }: Props) {
  const { data: history, isLoading } = useQuery<ContestRatingHistoryDto[]>({
    queryKey: ["rating-history", username],
    queryFn: () =>
      fetch(`/api/v1/u/${username}/rating-history`).then(r => r.json()),
    staleTime: 300_000,
  });

  if (isLoading) {
    return <div className="h-40 bg-zinc-800/40 animate-pulse rounded-lg" />;
  }

  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-zinc-500 text-center py-6">
        No contest participation yet.
      </p>
    );
  }

  const current = history[history.length - 1].newRating;
  const first   = history[0].oldRating;
  const overall = current - first;

  // Build chart data: start point + one point per contest
  const chartData = [
    { label: "Start", rating: history[0].oldRating, contest: null },
    ...history.map(h => ({
      label: h.contestSlug,
      title: h.contestTitle,
      rating: h.newRating,
      delta: h.newRating - h.oldRating,
      rank: h.rank,
      participantCount: h.participantCount,
      ...h,
    })),
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-zinc-100">{current}</span>
          <span className={`flex items-center gap-0.5 text-sm font-medium ${overall >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {overall >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {overall >= 0 ? "+" : ""}{overall} all time
          </span>
        </div>
        <span className="text-xs text-zinc-500">{history.length} contest{history.length !== 1 ? "s" : ""}</span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="label" hide />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
          />
          <ReferenceLine y={1500} stroke="#3f3f46" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
