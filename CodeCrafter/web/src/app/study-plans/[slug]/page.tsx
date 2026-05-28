"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  CheckCircle2, Circle, ChevronLeft, BookOpen, Clock, Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { StudyPlanDetail } from "@/types/studyplan";

const DIFFICULTY_VARIANT: Record<string, "easy" | "medium" | "hard"> = {
  EASY: "easy", MEDIUM: "medium", HARD: "hard",
};
const DIFFICULTY_COLOR: Record<string, string> = {
  EASY:   "text-emerald-400",
  MEDIUM: "text-amber-400",
  HARD:   "text-red-400",
  MIXED:  "text-blue-400",
};

export default function StudyPlanDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: plan, isLoading, isError } = useQuery<StudyPlanDetail>({
    queryKey: ["study-plan", slug],
    queryFn: () => api.get(`/study-plans/${slug}`).then(r => r.data),
    staleTime: 120_000,
  });

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-100 gap-3">
      <p className="text-zinc-400">Study plan not found.</p>
      <Link href="/study-plans" className="text-emerald-400 hover:underline text-sm">← Back to Study Plans</Link>
    </div>
  );

  const isDone = plan?.progressPercent === 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Back */}
        <Link href="/study-plans"
          className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-100 text-sm mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" />Study Plans
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        ) : plan ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{plan.icon ?? "📚"}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{plan.title}</h1>
                    {isDone && (
                      <span className="flex items-center gap-1 text-xs bg-emerald-900/60 text-emerald-400 px-2 py-0.5 rounded-full">
                        <Trophy className="h-3 w-3" />Complete
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{plan.problemCount} problems</span>
                    {plan.estimatedDays && (
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{plan.estimatedDays} days</span>
                    )}
                    <span className={`font-medium capitalize ${DIFFICULTY_COLOR[plan.difficulty] ?? ""}`}>
                      {plan.difficulty.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
              {plan.description && (
                <p className="text-sm text-zinc-400 leading-relaxed mt-3 ml-14">{plan.description}</p>
              )}

              {/* Progress bar */}
              <div className="mt-5">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500">{plan.completedCount} / {plan.problemCount} completed</span>
                  <span className={isDone ? "text-emerald-400 font-semibold" : "text-zinc-500"}>{plan.progressPercent}%</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isDone ? "bg-emerald-400" : "bg-emerald-600"}`}
                    style={{ width: `${plan.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Problem list */}
            <div className="space-y-1">
              {plan.problems.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-12">
                  No problems added to this plan yet.
                </p>
              ) : plan.problems.map((p, i) => (
                <Link key={p.problemId} href={`/problems/${p.problemSlug}`}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-zinc-900 transition-colors group">
                  <span className="text-xs text-zinc-600 w-6 text-right flex-shrink-0">{i + 1}</span>
                  {p.completed
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    : <Circle className="h-4 w-4 text-zinc-700 flex-shrink-0" />}
                  <span className={`text-sm flex-1 truncate group-hover:text-emerald-400 transition-colors ${
                    p.completed ? "text-zinc-400 line-through decoration-zinc-600" : "text-zinc-200"
                  }`}>
                    <span className="text-zinc-600 mr-1">{p.problemNumber}.</span>
                    {p.problemTitle}
                  </span>
                  {DIFFICULTY_VARIANT[p.difficulty] && (
                    <Badge variant={DIFFICULTY_VARIANT[p.difficulty]} className="flex-shrink-0 text-xs">
                      {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
