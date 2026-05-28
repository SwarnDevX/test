"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Shuffle, CheckCircle2, MinusCircle, Circle, ChevronUp, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { DailyChallengeBanner } from "@/components/challenge/DailyChallengeBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProblemListItem, PageResponse } from "@/types/problems";

const DIFFICULTY_LABELS: Record<string, string> = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };
const DIFFICULTY_VARIANT: Record<string, "easy" | "medium" | "hard"> = {
  EASY: "easy", MEDIUM: "medium", HARD: "hard",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "SOLVED") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "ATTEMPTED") return <MinusCircle className="h-4 w-4 text-amber-400" />;
  return <Circle className="h-4 w-4 text-zinc-600" />;
}

function SortHeader({ label, field, current, dir, onSort }: {
  label: string; field: string; current: string; dir: string;
  onSort: (f: string) => void;
}) {
  const active = current === field;
  return (
    <button onClick={() => onSort(field)}
      className="flex items-center gap-1 hover:text-zinc-100 transition-colors">
      {label}
      {active ? (dir === "asc"
        ? <ChevronUp className="h-3 w-3" />
        : <ChevronDown className="h-3 w-3" />)
        : <ChevronDown className="h-3 w-3 opacity-30" />}
    </button>
  );
}

export default function ProblemsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [difficulty, setDifficulty] = useState(sp.get("difficulty") ?? "all");
  const [sortBy, setSortBy] = useState(sp.get("sortBy") ?? "number");
  const [sortDir, setSortDir] = useState(sp.get("sortDir") ?? "asc");
  const [page, setPage] = useState(Number(sp.get("page") ?? 0));

  const params = {
    difficulty: difficulty !== "all" ? difficulty : undefined,
    search: search || undefined,
    sortBy, sortDir, page, size: 20,
  };

  const { data, isLoading } = useQuery<PageResponse<ProblemListItem>>({
    queryKey: ["problems", params],
    queryFn: () => api.get("/problems", { params }).then(r => r.data),
    staleTime: 30_000,
  });

  function handleSort(field: string) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("asc"); }
    setPage(0);
  }

  async function handleRandom() {
    const res = await api.get("/problems/random",
      { params: { difficulty: difficulty !== "all" ? difficulty : undefined } });
    router.push(`/problems/${res.data.slug}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Problems</h1>
          <Button variant="outline" className="border-zinc-700 gap-2" onClick={handleRandom}>
            <Shuffle className="h-4 w-4" /> Pick One
          </Button>
        </div>

        <div className="mb-6">
          <DailyChallengeBanner />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Input
            placeholder="Search by title or number..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="max-w-xs"
          />
          <Select value={difficulty} onValueChange={v => { setDifficulty(v); setPage(0); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left w-8"></th>
                <th className="px-4 py-3 text-left w-16">
                  <SortHeader label="#" field="number" current={sortBy} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Title" field="title" current={sortBy} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Tags</th>
                <th className="px-4 py-3 text-left w-28">
                  <SortHeader label="Difficulty" field="difficulty" current={sortBy} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left w-28 hidden sm:table-cell">
                  <SortHeader label="Acceptance" field="acceptance" current={sortBy} dir={sortDir} onSort={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.content.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-4 py-3">
                        <StatusIcon status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{p.number}</td>
                      <td className="px-4 py-3">
                        <Link href={`/problems/${p.slug}`}
                          className="hover:text-emerald-400 transition-colors font-medium">
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {p.tags.slice(0, 3).map(t => (
                            <Badge key={t} variant="tag">{t}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={DIFFICULTY_VARIANT[p.difficulty]}>
                          {DIFFICULTY_LABELS[p.difficulty]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                        {Number(p.acceptanceRate).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
            <span>
              {data.totalElements} problems
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-zinc-700"
                disabled={!data.hasPrevious} onClick={() => setPage(p => p - 1)}>
                Previous
              </Button>
              <span className="flex items-center px-3">
                {data.page + 1} / {data.totalPages}
              </span>
              <Button variant="outline" size="sm" className="border-zinc-700"
                disabled={!data.hasNext} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
