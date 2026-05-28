"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { BookOpen, Clock, Trophy, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { StudyPlanSummary } from "@/types/studyplan";

const DIFFICULTY_COLOR: Record<string, string> = {
  EASY:   "text-emerald-400",
  MEDIUM: "text-amber-400",
  HARD:   "text-red-400",
  MIXED:  "text-blue-400",
};

function PlanCard({ plan }: { plan: StudyPlanSummary }) {
  const diffColor = DIFFICULTY_COLOR[plan.difficulty] ?? "text-zinc-400";
  const isStarted = plan.completedCount > 0;
  const isDone = plan.progressPercent === 100;

  return (
    <Link href={`/study-plans/${plan.slug}`}
      className="group flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all duration-200">
      <div className="flex items-start gap-3">
        <span className="text-3xl flex-shrink-0">{plan.icon ?? "📚"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              {plan.title}
            </h2>
            {isDone && <span className="text-xs bg-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded-full">Complete</span>}
          </div>
          {plan.description && (
            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{plan.description}</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{plan.problemCount} problems</span>
        {plan.estimatedDays && (
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{plan.estimatedDays} days</span>
        )}
        <span className={`font-medium capitalize ${diffColor}`}>{plan.difficulty.toLowerCase()}</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-zinc-500">
            {isStarted ? `${plan.completedCount} / ${plan.problemCount} solved` : "Not started"}
          </span>
          <span className={isDone ? "text-emerald-400" : "text-zinc-500"}>{plan.progressPercent}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isDone ? "bg-emerald-400" : "bg-emerald-600"}`}
            style={{ width: `${plan.progressPercent}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export default function StudyPlansPage() {
  const { data = [], isLoading } = useQuery<StudyPlanSummary[]>({
    queryKey: ["study-plans"],
    queryFn: () => api.get("/study-plans").then(r => r.data),
    staleTime: 300_000,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-emerald-400" />
            <h1 className="text-2xl font-bold">Study Plans</h1>
          </div>
          <p className="text-zinc-500 text-sm">
            Structured learning paths to master coding interviews. Problems are automatically marked complete when you get AC.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            : data.map(plan => <PlanCard key={plan.slug} plan={plan} />)}
        </div>

        {!isLoading && data.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-zinc-500">
            <p>No study plans available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
