"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, RefreshCw, ToggleLeft, ToggleRight, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import api from "@/lib/api";

interface ProblemRow {
  id: number;
  number: number;
  slug: string;
  title: string;
  difficulty: string;
  active: boolean;
  acceptanceRate: number;
  totalSubmissions: number;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

const DIFF_COLORS: Record<string, string> = {
  EASY:   "text-emerald-400",
  MEDIUM: "text-amber-400",
  HARD:   "text-red-400",
};

export default function AdminProblemsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<PageResponse<ProblemRow>>({
    queryKey: ["admin-problems"],
    queryFn: () => api.get("/admin/problems?size=200").then(r => r.data),
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ slug, active }: { slug: string; active: boolean }) =>
      api.patch(`/admin/problems/${slug}/toggle-active?active=${active}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-problems"] });
      toast.success("Problem updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejudgeMutation = useMutation({
    mutationFn: (slug: string) => api.post(`/admin/problems/${slug}/rejudge`).then(r => r.data),
    onSuccess: (data) => toast.success(`Re-queued ${data.count} submissions`),
    onError: (e: Error) => toast.error(e.message),
  });

  const problems = data?.content ?? [];

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Problems</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{data?.totalElements ?? 0} total</p>
        </div>
        <Link
          href="/admin/problems/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Problem
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/80">
            <tr>
              <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium w-16">#</th>
              <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium">Title</th>
              <th className="text-center px-4 py-3 text-xs text-zinc-400 font-medium w-24">Difficulty</th>
              <th className="text-right px-4 py-3 text-xs text-zinc-400 font-medium w-24">Acceptance</th>
              <th className="text-center px-4 py-3 text-xs text-zinc-400 font-medium w-20">Status</th>
              <th className="text-right px-4 py-3 text-xs text-zinc-400 font-medium w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {isLoading
              ? [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                  </tr>
                ))
              : problems.map(p => (
                  <tr key={p.id} className="bg-zinc-900/40 hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{p.number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-zinc-100 ${!p.active ? "line-through opacity-50" : ""}`}>
                          {p.title}
                        </span>
                        <a
                          href={`/problems/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-600 hover:text-zinc-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${DIFF_COLORS[p.difficulty] ?? "text-zinc-400"}`}>
                        {p.difficulty.charAt(0) + p.difficulty.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 text-xs">
                      {p.acceptanceRate != null ? `${(p.acceptanceRate * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleMutation.mutate({ slug: p.slug, active: !p.active })}
                        className="text-zinc-400 hover:text-zinc-100 transition-colors"
                        title={p.active ? "Deactivate" : "Activate"}
                      >
                        {p.active
                          ? <ToggleRight className="h-5 w-5 text-emerald-400" />
                          : <ToggleLeft className="h-5 w-5 text-zinc-600" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/problems/${p.slug}`}
                          className="text-xs text-zinc-400 hover:text-zinc-100 border border-zinc-700 px-2.5 py-1 rounded-md hover:border-zinc-500 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => rejudgeMutation.mutate(p.slug)}
                          disabled={rejudgeMutation.isPending}
                          className="text-zinc-500 hover:text-amber-400 transition-colors disabled:opacity-50"
                          title="Re-judge all submissions"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
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
