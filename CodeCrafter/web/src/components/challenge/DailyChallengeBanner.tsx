"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Flame, CheckCircle2, ArrowRight, Zap } from "lucide-react";
import api from "@/lib/api";
import type { DailyChallengeDto } from "@/types/studyplan";

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY:   "text-emerald-400",
  MEDIUM: "text-amber-400",
  HARD:   "text-red-400",
};

export function DailyChallengeBanner() {
  const { data, isLoading, isError } = useQuery<DailyChallengeDto>({
    queryKey: ["daily-challenge"],
    queryFn: () => api.get("/daily-challenge").then(r => r.data),
    staleTime: 300_000,
    retry: false,
  });

  if (isLoading || isError || !data) return null;

  const diffColor = DIFFICULTY_COLOR[data.problemDifficulty] ?? "text-zinc-400";
  const today = new Date(data.challengeDate).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <Link href={`/problems/${data.problemSlug}`}
      className={`group flex items-center gap-4 rounded-xl border px-5 py-4 transition-all duration-200 ${
        data.solvedToday
          ? "border-emerald-700/50 bg-emerald-950/30 hover:border-emerald-600/60"
          : "border-amber-700/40 bg-amber-950/20 hover:border-amber-600/50"
      }`}>
      <div className={`flex-shrink-0 ${data.solvedToday ? "text-emerald-400" : "text-amber-400"}`}>
        {data.solvedToday
          ? <CheckCircle2 className="h-7 w-7" />
          : <Flame className="h-7 w-7" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Daily Challenge</span>
          <span className="text-xs text-zinc-600">{today}</span>
        </div>
        <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
          {data.problemTitle}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className={`font-medium ${diffColor}`}>
            {data.problemDifficulty.charAt(0) + data.problemDifficulty.slice(1).toLowerCase()}
          </span>
          <span className="flex items-center gap-0.5 text-amber-400">
            <Zap className="h-3 w-3" />+{data.bonusPoints} pts
          </span>
          {data.solvedToday && <span className="text-emerald-400 font-semibold">Solved ✓</span>}
        </div>
      </div>

      <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
    </Link>
  );
}
