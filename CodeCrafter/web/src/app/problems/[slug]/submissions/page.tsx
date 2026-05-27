"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronLeft, Code } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { SubmissionDto, SubmissionDetailDto } from "@/types/submissions";
import type { PageResponse } from "@/types/problems";

const VERDICT_COLOR: Record<string, string> = {
  ACCEPTED:             "text-emerald-400",
  WRONG_ANSWER:         "text-red-400",
  COMPILE_ERROR:        "text-amber-400",
  RUNTIME_ERROR:        "text-red-400",
  TIME_LIMIT_EXCEEDED:  "text-amber-400",
  MEMORY_LIMIT_EXCEEDED:"text-amber-400",
  OUTPUT_LIMIT_EXCEEDED:"text-amber-400",
  INTERNAL_ERROR:       "text-zinc-400",
  QUEUED:               "text-zinc-400",
  RUNNING:              "text-blue-400",
};

const LANG_LABELS: Record<string, string> = {
  java: "Java", python: "Python", cpp: "C++", c: "C",
  javascript: "JavaScript", go: "Go", rust: "Rust",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ProblemSubmissionsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<SubmissionDetailDto | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const { data, isLoading } = useQuery<PageResponse<SubmissionDto>>({
    queryKey: ["submissions", slug, page],
    queryFn: () => api.get(`/problems/${slug}/submissions`, { params: { page, size: 20 } }).then(r => r.data),
    staleTime: 10_000,
  });

  async function openDetail(id: number) {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/submissions/${id}`);
      setSelected(res.data);
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/problems/${slug}`}
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 transition-colors text-sm">
            <ChevronLeft className="h-4 w-4" /> Back to Problem
          </Link>
          <h1 className="text-xl font-semibold">My Submissions</h1>
        </div>

        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Language</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Runtime</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Cases</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : data?.content.map(s => {
                    const verdict = s.verdict ?? s.status;
                    return (
                      <tr key={s.id}
                        className="hover:bg-zinc-900/60 transition-colors cursor-pointer"
                        onClick={() => openDetail(s.id)}>
                        <td className={`px-4 py-3 font-semibold ${VERDICT_COLOR[verdict] ?? "text-zinc-400"}`}>
                          {verdict.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-3 text-zinc-300">{LANG_LABELS[s.language] ?? s.language}</td>
                        <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                          {s.runtimeMs != null ? `${s.runtimeMs}ms` : "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                          {s.testcasesPassed != null
                            ? `${s.testcasesPassed}/${s.totalTestcases}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{formatDate(s.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Code className="h-4 w-4 text-zinc-600" />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
            <span>{data.totalElements} submissions</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-zinc-700"
                disabled={!data.hasPrevious} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center px-3">{data.page + 1} / {data.totalPages}</span>
              <Button variant="outline" size="sm" className="border-zinc-700"
                disabled={!data.hasNext} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <SubmissionDetailModal detail={selected} onClose={() => setSelected(null)} />
      )}
      {loadingDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

function SubmissionDetailModal({
  detail, onClose,
}: { detail: SubmissionDetailDto; onClose: () => void }) {
  const verdict = detail.verdict ?? detail.status;
  const color = VERDICT_COLOR[verdict] ?? "text-zinc-400";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className={`font-semibold ${color}`}>{verdict.replace(/_/g, " ")}</span>
            <span className="text-zinc-500 text-sm">{LANG_LABELS[detail.language] ?? detail.language}</span>
            {detail.runtimeMs != null && (
              <span className="text-zinc-500 text-sm">{detail.runtimeMs}ms</span>
            )}
            {detail.testcasesPassed != null && (
              <span className="text-zinc-500 text-sm">
                {detail.testcasesPassed}/{detail.totalTestcases} cases
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {detail.compileError && (
            <div>
              <p className="text-xs text-amber-400 font-semibold mb-1">Compile Error</p>
              <pre className="text-xs font-mono text-zinc-300 bg-zinc-950 p-3 rounded border border-zinc-800 whitespace-pre-wrap">
                {detail.compileError}
              </pre>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-2">Source Code</p>
            <pre className="text-xs font-mono text-zinc-200 bg-zinc-950 p-4 rounded border border-zinc-800 overflow-x-auto whitespace-pre">
              {detail.sourceCode}
            </pre>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex justify-end">
          <Button variant="outline" size="sm" className="border-zinc-700" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
