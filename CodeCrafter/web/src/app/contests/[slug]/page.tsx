"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Clock, Users, CheckCircle2, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { ContestDto, ContestProblemDto, LeaderboardEntryDto } from "@/types/contest";

type Tab = "problems" | "leaderboard";

const DIFF_COLORS: Record<string, string> = {
  EASY:   "text-emerald-400",
  MEDIUM: "text-amber-400",
  HARD:   "text-red-400",
};

// ── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(target: string) {
  const [remaining, setRemaining] = useState(() => new Date(target).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(new Date(target).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remaining <= 0) return null;
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Countdown({ contest }: { contest: ContestDto }) {
  const startsIn = useCountdown(contest.startTime);
  const endsIn   = useCountdown(contest.endTime);

  if (contest.status === "UPCOMING" && startsIn) {
    return (
      <div className="rounded-lg border border-blue-800 bg-blue-950/40 p-4 text-center">
        <p className="text-xs text-blue-400 mb-1">Starts in</p>
        <p className="text-3xl font-mono font-bold text-blue-300">{startsIn}</p>
      </div>
    );
  }
  if (contest.status === "RUNNING" && endsIn) {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/30 p-4 text-center">
        <p className="text-xs text-emerald-400 mb-1">Ends in</p>
        <p className="text-3xl font-mono font-bold text-emerald-300">{endsIn}</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-4 text-center">
      <p className="text-zinc-400 text-sm">Contest has ended</p>
    </div>
  );
}

// ── Problem List ──────────────────────────────────────────────────────────────

function ProblemList({ slug, contestStatus }: { slug: string; contestStatus: string }) {
  const { data: problems, isLoading, isError } = useQuery<ContestProblemDto[]>({
    queryKey: ["contest-problems", slug],
    queryFn: () => api.get(`/contests/${slug}/problems`).then(r => r.data),
    enabled: contestStatus !== "UPCOMING",
    refetchInterval: contestStatus === "RUNNING" ? 30_000 : false,
  });

  if (contestStatus === "UPCOMING") {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-zinc-500 gap-2">
        <Clock className="h-7 w-7 opacity-40" />
        <p className="text-sm">Problems will be revealed when the contest starts.</p>
      </div>
    );
  }

  if (isLoading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;
  if (isError || !problems) return <p className="text-zinc-500 text-sm">Failed to load problems.</p>;

  return (
    <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 overflow-hidden">
      {problems.map(p => (
        <Link
          key={p.problemId}
          href={`/problems/${p.slug}`}
          className="flex items-center gap-4 px-4 py-3 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
        >
          <span className="w-6 text-sm font-mono text-zinc-400 text-center">{p.alias}</span>
          <span className="flex-1 text-sm text-zinc-100 hover:text-emerald-400 transition-colors">
            {p.title}
          </span>
          <span className={`text-xs font-medium ${DIFF_COLORS[p.difficulty] ?? "text-zinc-400"}`}>
            {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
          </span>
          <span className="text-xs text-zinc-500 w-16 text-right">{p.points} pts</span>
          <span className="w-6 flex justify-center">
            {p.solved
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              : p.wrongAttempts > 0
                ? <span className="text-xs text-red-400">-{p.wrongAttempts}</span>
                : null}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ── Leaderboard ──────────────────────────────────────────────────────────────

function formatPenalty(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Leaderboard({ slug }: { slug: string }) {
  const { data: entries, isLoading } = useQuery<LeaderboardEntryDto[]>({
    queryKey: ["contest-leaderboard", slug],
    queryFn: () => api.get(`/contests/${slug}/leaderboard`).then(r => r.data),
    refetchInterval: 15_000,
  });

  if (isLoading) return <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>;
  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-zinc-500 gap-2">
        <Trophy className="h-7 w-7 opacity-40" />
        <p className="text-sm">No submissions yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-zinc-800/80">
          <tr>
            <th className="text-left px-4 py-2.5 text-xs text-zinc-400 font-medium w-12">#</th>
            <th className="text-left px-4 py-2.5 text-xs text-zinc-400 font-medium">Participant</th>
            <th className="text-center px-4 py-2.5 text-xs text-zinc-400 font-medium w-20">Solved</th>
            <th className="text-right px-4 py-2.5 text-xs text-zinc-400 font-medium w-24">Penalty</th>
            {entries[0]?.ratingChange !== null && (
              <th className="text-right px-4 py-2.5 text-xs text-zinc-400 font-medium w-20">Δ Rating</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {entries.map(entry => {
            const top3 = ["🥇", "🥈", "🥉"];
            const ratingPos = entry.ratingChange !== null && entry.ratingChange > 0;
            const ratingNeg = entry.ratingChange !== null && entry.ratingChange < 0;
            return (
              <tr key={entry.userId} className="bg-zinc-900/40 hover:bg-zinc-900 transition-colors">
                <td className="px-4 py-3 text-zinc-300 font-mono">
                  {entry.rank <= 3 ? top3[entry.rank - 1] : entry.rank}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/u/${entry.username}`} className="text-zinc-100 hover:text-emerald-400 transition-colors">
                    {entry.username}
                  </Link>
                </td>
                <td className="px-4 py-3 text-center text-emerald-400 font-medium">{entry.solved}</td>
                <td className="px-4 py-3 text-right text-zinc-400 font-mono text-xs">
                  {formatPenalty(entry.penaltySecs)}
                </td>
                {entry.ratingChange !== null && (
                  <td className="px-4 py-3 text-right font-medium">
                    <span className={`flex items-center justify-end gap-0.5 ${ratingPos ? "text-emerald-400" : ratingNeg ? "text-red-400" : "text-zinc-500"}`}>
                      {ratingPos ? <ChevronUp className="h-3.5 w-3.5" /> : ratingNeg ? <ChevronDown className="h-3.5 w-3.5" /> : null}
                      {entry.ratingChange > 0 ? `+${entry.ratingChange}` : entry.ratingChange}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ContestDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("problems");

  const { data: contest, isLoading } = useQuery<ContestDto>({
    queryKey: ["contest", slug],
    queryFn: () => api.get(`/contests/${slug}`).then(r => r.data),
    refetchInterval: 30_000,
  });

  const registerMutation = useMutation({
    mutationFn: () => api.post(`/contests/${slug}/register`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contest", slug] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Contest not found.
      </div>
    );
  }

  const isLive = contest.status === "RUNNING";
  const hasEnded = contest.status === "ENDED";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{contest.title}</h1>
            {isLive && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-800 bg-emerald-950/60 text-emerald-400 animate-pulse">
                Live
              </span>
            )}
            {hasEnded && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400">
                Ended
              </span>
            )}
          </div>
          {contest.description && (
            <p className="text-sm text-zinc-400">{contest.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{contest.participantCount.toLocaleString()} participants</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
              {new Date(contest.startTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {new Date(contest.endTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Countdown + register */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1">
            <Countdown contest={contest} />
          </div>
          {!hasEnded && session && !contest.registered && (
            <button
              onClick={() => registerMutation.mutate()}
              disabled={registerMutation.isPending}
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? "Registering…" : "Register"}
            </button>
          )}
          {contest.registered && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm px-4">
              <CheckCircle2 className="h-4 w-4" />
              Registered
            </div>
          )}
          {!session && !hasEnded && (
            <Link href="/login" className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 text-sm text-center hover:border-emerald-500 transition-colors">
              Log in to register
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-zinc-800 mb-4">
            {(["problems", "leaderboard"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "problems" && (
            <ProblemList slug={slug} contestStatus={contest.status} />
          )}
          {tab === "leaderboard" && (
            <Leaderboard slug={slug} />
          )}
        </div>
      </div>
    </div>
  );
}
