"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Trophy, Users, Clock, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { ContestDto, PageResponse } from "@/types/contest";

const STATUS_STYLES: Record<string, string> = {
  UPCOMING: "bg-blue-900/60 text-blue-400 border-blue-800",
  RUNNING:  "bg-emerald-900/60 text-emerald-400 border-emerald-800 animate-pulse",
  ENDED:    "bg-zinc-800 text-zinc-400 border-zinc-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getDuration(startTime: string, endTime: string) {
  const ms = new Date(endTime).getTime() - new Date(startTime).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}` : `${m}m`;
}

function ContestCard({ contest }: { contest: ContestDto }) {
  return (
    <Link
      href={`/contests/${contest.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors leading-tight">
          {contest.title}
        </h2>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLES[contest.status]}`}>
          {contest.status.charAt(0) + contest.status.slice(1).toLowerCase()}
        </span>
      </div>

      {contest.description && (
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{contest.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(contest.startTime)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {getDuration(contest.startTime, contest.endTime)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {contest.participantCount.toLocaleString()} registered
        </span>
      </div>

      {contest.registered && (
        <span className="text-xs text-emerald-400">✓ Registered</span>
      )}
    </Link>
  );
}

export default function ContestsPage() {
  const { data, isLoading } = useQuery<PageResponse<ContestDto>>({
    queryKey: ["contests"],
    queryFn: () => api.get("/contests?size=50").then(r => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const contests = data?.content ?? [];

  const upcoming = contests.filter(c => c.status === "UPCOMING");
  const running  = contests.filter(c => c.status === "RUNNING");
  const ended    = contests.filter(c => c.status === "ENDED");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-8">
          <Trophy className="h-5 w-5 text-emerald-400" />
          <h1 className="text-2xl font-bold">Contests</h1>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        )}

        {!isLoading && (
          <div className="space-y-8">
            {running.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-emerald-400 mb-3">Live Now</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {running.map(c => <ContestCard key={c.slug} contest={c} />)}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-blue-400 mb-3">Upcoming</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcoming.map(c => <ContestCard key={c.slug} contest={c} />)}
                </div>
              </section>
            )}

            {ended.length > 0 && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Past Contests</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {ended.map(c => <ContestCard key={c.slug} contest={c} />)}
                </div>
              </section>
            )}

            {contests.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-zinc-500">
                <Trophy className="h-8 w-8 opacity-30" />
                <p>No contests scheduled yet. Check back soon!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
