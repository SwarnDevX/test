"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Zap, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import type { DailyChallengeDto } from "@/types/studyplan";

const input = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function AdminDailyChallengePage() {
  const qc = useQueryClient();

  const { data: today } = useQuery<DailyChallengeDto | null>({
    queryKey: ["daily-challenge"],
    queryFn: () => api.get("/daily-challenge").then(r => r.data).catch(() => null),
  });

  const [problemId, setProblemId] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [bonusPoints, setBonusPoints] = useState("10");

  const setMutation = useMutation({
    mutationFn: () => api.put("/daily-challenge", {
      problemId: parseInt(problemId),
      challengeDate: date,
      bonusPoints: parseInt(bonusPoints) || 10,
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-challenge"] });
      toast.success("Daily challenge set");
      setProblemId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-bold">Daily Challenge</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Schedule the featured problem of the day.</p>
      </div>

      {/* Today's challenge */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <Calendar className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold">Today's Challenge</span>
        </div>
        {today ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-zinc-100 text-sm font-medium">{today.problemTitle}</p>
              <p className="text-xs text-zinc-500">{formatDate(today.challengeDate)}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs text-amber-400">
              <Zap className="h-3.5 w-3.5" />
              {today.bonusPoints} bonus pts
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 italic">No challenge set for today.</p>
        )}
      </div>

      {/* Schedule form */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300">Schedule Challenge</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs text-zinc-400">Problem ID</label>
            <input
              className={input}
              type="number"
              value={problemId}
              onChange={e => setProblemId(e.target.value)}
              placeholder="123"
            />
          </div>
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs text-zinc-400">Date</label>
            <input
              className={input}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 col-span-1">
            <label className="text-xs text-zinc-400">Bonus Points</label>
            <input
              className={input}
              type="number"
              value={bonusPoints}
              onChange={e => setBonusPoints(e.target.value)}
              min={1}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setMutation.mutate()}
            disabled={!problemId || !date || setMutation.isPending}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {setMutation.isPending ? "Saving…" : "Schedule Challenge"}
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        Tip: You can look up problem IDs in the Problems list. Set challenges at least a day in advance.
      </p>
    </div>
  );
}
