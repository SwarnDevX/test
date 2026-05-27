"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { SubmissionDto } from "@/types/submissions";
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
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<PageResponse<SubmissionDto>>({
    queryKey: ["my-submissions", page],
    queryFn: () => api.get("/submissions", { params: { page, size: 25 } }).then(r => r.data),
    staleTime: 10_000,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Submissions</h1>

        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Problem</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Language</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Runtime</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Cases</th>
                <th className="px-4 py-3 text-left">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
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
                        onClick={() => router.push(`/problems/${s.problemSlug}/submissions`)}>
                        <td className={`px-4 py-3 font-semibold ${VERDICT_COLOR[verdict] ?? "text-zinc-400"}`}>
                          {verdict.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/problems/${s.problemSlug}`}
                            className="hover:text-emerald-400 transition-colors"
                            onClick={e => e.stopPropagation()}>
                            <span className="text-zinc-500 mr-1">{s.problemNumber}.</span>
                            {s.problemTitle}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                          {LANG_LABELS[s.language] ?? s.language}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">
                          {s.runtimeMs != null ? `${s.runtimeMs}ms` : "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">
                          {s.testcasesPassed != null
                            ? `${s.testcasesPassed}/${s.totalTestcases}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{formatDate(s.createdAt)}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
            <span>{data.totalElements} total submissions</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-zinc-700"
                disabled={!data.hasPrevious} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center px-3">{data.page + 1} / {data.totalPages}</span>
              <Button variant="outline" size="sm" className="border-zinc-700"
                disabled={!data.hasNext} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}

        {!isLoading && data?.content.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-500 mb-3">No submissions yet.</p>
            <Link href="/problems" className="text-emerald-400 hover:underline text-sm">
              Start solving problems →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
