"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ExternalLink, StopCircle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import type { ContestDto, PageResponse } from "@/types/contest";

const input = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600";

const STATUS_BADGE: Record<string, string> = {
  UPCOMING: "bg-blue-900/60 text-blue-400",
  RUNNING:  "bg-emerald-900/60 text-emerald-400",
  ENDED:    "bg-zinc-800 text-zinc-400",
};

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminContestsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", slug: "", description: "", type: "RATED",
    startTime: "", endTime: "", visible: true,
  });

  const { data, isLoading } = useQuery<PageResponse<ContestDto>>({
    queryKey: ["admin-contests"],
    queryFn: () => api.get("/contests?size=100").then(r => r.data),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/admin/contests", {
      ...form,
      startTime: new Date(form.startTime).toISOString(),
      endTime: new Date(form.endTime).toISOString(),
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-contests"] });
      setShowForm(false);
      setForm({ title: "", slug: "", description: "", type: "RATED", startTime: "", endTime: "", visible: true });
      toast.success("Contest created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const endMutation = useMutation({
    mutationFn: (slug: string) => api.post(`/admin/contests/${slug}/end`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-contests"] }); toast.success("Contest ended & ratings computed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const contests = data?.content ?? [];

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Contests</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Contest
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Create Contest</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="text-xs text-zinc-400">Title</label><input className={input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><label className="text-xs text-zinc-400">Slug</label><input className={input} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="weekly-contest-1" /></div>
            <div className="space-y-1.5"><label className="text-xs text-zinc-400">Start Time</label><input className={input} type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} /></div>
            <div className="space-y-1.5"><label className="text-xs text-zinc-400">End Time</label><input className={input} type="datetime-local" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Type</label>
              <select className={input} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="RATED">Rated</option>
                <option value="SPECIAL">Special / Unrated</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
                <input type="checkbox" checked={form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))} className="rounded" />
                Visible to public
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Description</label>
            <textarea className={`${input} min-h-[80px]`} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Cancel</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.title || !form.slug || !form.startTime || !form.endTime}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/80">
            <tr>
              <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium">Title</th>
              <th className="text-center px-4 py-3 text-xs text-zinc-400 font-medium w-24">Status</th>
              <th className="text-right px-4 py-3 text-xs text-zinc-400 font-medium w-32">Start</th>
              <th className="text-right px-4 py-3 text-xs text-zinc-400 font-medium w-20">Participants</th>
              <th className="text-right px-4 py-3 text-xs text-zinc-400 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {isLoading
              ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3 text-zinc-600 text-xs">Loading…</td></tr>)
              : contests.map(c => (
                <tr key={c.slug} className="bg-zinc-900/40 hover:bg-zinc-900 transition-colors">
                  <td className="px-4 py-3 text-zinc-100">{c.title}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status]}`}>
                      {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400 text-xs">
                    {new Date(c.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400 text-xs">{c.participantCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/contests/${c.slug}`} target="_blank" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      {c.status === "RUNNING" && (
                        <button
                          onClick={() => endMutation.mutate(c.slug)}
                          disabled={endMutation.isPending}
                          className="text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="End contest & compute ratings"
                        >
                          <StopCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
