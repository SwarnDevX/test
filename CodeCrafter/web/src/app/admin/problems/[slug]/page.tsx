"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Plus, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

type Tab = "editorial" | "test-cases";

interface TestCase {
  id: number;
  input: string;
  expectedOutput: string;
  sortOrder: number;
  sample: boolean;
}

interface ProblemDetail {
  slug: string;
  title: string;
  active: boolean;
  difficulty: string;
}

interface EditorialDto {
  contentMarkdown: string;
  isPublished: boolean;
}

const input = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600";

export default function AdminEditProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("editorial");

  const { data: problem } = useQuery<ProblemDetail>({
    queryKey: ["admin-problem", slug],
    queryFn: () => api.get(`/admin/problems?size=200`).then(r =>
      r.data.content.find((p: ProblemDetail) => p.slug === slug) ?? null
    ),
  });

  const toggleMutation = useMutation({
    mutationFn: (active: boolean) => api.patch(`/admin/problems/${slug}/toggle-active?active=${active}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-problem", slug] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejudgeMutation = useMutation({
    mutationFn: () => api.post(`/admin/problems/${slug}/rejudge`).then(r => r.data),
    onSuccess: (d) => toast.success(`Re-queued ${d.count} submissions`),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/problems" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{problem?.title ?? slug}</h1>
            <p className="text-xs text-zinc-500">/problems/{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => rejudgeMutation.mutate()}
            disabled={rejudgeMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:border-amber-500/50 hover:text-amber-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-judge all
          </button>
          {problem && (
            <button
              onClick={() => toggleMutation.mutate(!problem.active)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:border-emerald-500/50 transition-colors"
            >
              {problem.active
                ? <><ToggleRight className="h-4 w-4 text-emerald-400" /> Active</>
                : <><ToggleLeft className="h-4 w-4 text-zinc-500" /> Inactive</>}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(["editorial", "test-cases"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {tab === "editorial"   && <EditorialTab slug={slug} />}
      {tab === "test-cases"  && <TestCasesTab slug={slug} />}
    </div>
  );
}

// ── Editorial Tab ─────────────────────────────────────────────────────────────

function EditorialTab({ slug }: { slug: string }) {
  const qc = useQueryClient();

  const { data } = useQuery<EditorialDto | null>({
    queryKey: ["admin-editorial", slug],
    queryFn: () => api.get(`/admin/problems/${slug}/editorial`).then(r => r.data).catch(() => null),
  });

  const [content, setContent] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const current = content ?? data?.contentMarkdown ?? "";
  const isPublished = data?.isPublished ?? published;

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/admin/problems/${slug}/editorial`, { contentMarkdown: current, isPublished }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-editorial", slug] }); toast.success("Editorial saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={e => setPublished(e.target.checked)}
            className="rounded"
          />
          Published (visible to users)
        </label>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
        >
          {saveMutation.isPending ? "Saving…" : "Save Editorial"}
        </button>
      </div>
      <textarea
        className={`${input} min-h-[500px] font-mono text-xs leading-relaxed`}
        value={current}
        onChange={e => setContent(e.target.value)}
        placeholder="# Approach 1: Brute Force&#10;&#10;Explain the approach here..."
      />
      <p className="text-xs text-zinc-600">Markdown supported. Images can be embedded via MinIO URLs.</p>
    </div>
  );
}

// ── Test Cases Tab ────────────────────────────────────────────────────────────

function TestCasesTab({ slug }: { slug: string }) {
  const qc = useQueryClient();
  const [newInput, setNewInput]   = useState("");
  const [newOutput, setNewOutput] = useState("");
  const [isSample, setIsSample]   = useState(false);

  const { data: testCases = [], isLoading } = useQuery<TestCase[]>({
    queryKey: ["admin-testcases", slug],
    queryFn: () => api.get(`/problems/${slug}`).then(r => r.data.testCases ?? []).catch(() => []),
  });

  const addMutation = useMutation({
    mutationFn: () => api.post(`/admin/problems/${slug}/test-cases`, {
      input: newInput, expectedOutput: newOutput, sample: isSample,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-testcases", slug] });
      setNewInput(""); setNewOutput(""); setIsSample(false);
      toast.success("Test case added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/problems/${slug}/test-cases/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-testcases", slug] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const hidden = testCases.filter(tc => !tc.sample);
  const sample = testCases.filter(tc => tc.sample);

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="rounded-xl border border-zinc-800 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300">Add Test Case</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Input</label>
            <textarea className={`${input} font-mono text-xs min-h-[80px]`} value={newInput} onChange={e => setNewInput(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-400">Expected Output</label>
            <textarea className={`${input} font-mono text-xs min-h-[80px]`} value={newOutput} onChange={e => setNewOutput(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
            <input type="checkbox" checked={isSample} onChange={e => setIsSample(e.target.checked)} className="rounded" />
            Sample (visible to users)
          </label>
          <button
            onClick={() => addMutation.mutate()}
            disabled={!newInput || !newOutput || addMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Lists */}
      <TestCaseList title="Hidden Test Cases" cases={hidden} onDelete={id => deleteMutation.mutate(id)} loading={isLoading} />
      <TestCaseList title="Sample Test Cases" cases={sample}  onDelete={id => deleteMutation.mutate(id)} loading={isLoading} />
    </div>
  );
}

function TestCaseList({ title, cases, onDelete, loading }: {
  title: string; cases: TestCase[]; onDelete: (id: number) => void; loading: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-300 mb-3">{title} ({cases.length})</h3>
      {loading ? (
        <p className="text-xs text-zinc-500">Loading…</p>
      ) : cases.length === 0 ? (
        <p className="text-xs text-zinc-600 italic">None yet.</p>
      ) : (
        <div className="space-y-2">
          {cases.map(tc => (
            <div key={tc.id} className="flex gap-3 rounded-lg border border-zinc-800 p-3 text-xs font-mono group">
              <div className="flex-1 min-w-0">
                <p className="text-zinc-500 mb-0.5">Input:</p>
                <pre className="text-zinc-300 whitespace-pre-wrap break-all">{tc.input}</pre>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-500 mb-0.5">Expected:</p>
                <pre className="text-zinc-300 whitespace-pre-wrap break-all">{tc.expectedOutput}</pre>
              </div>
              <button
                onClick={() => onDelete(tc.id)}
                className="flex-shrink-0 text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
