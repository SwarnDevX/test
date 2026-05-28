"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, BookOpen, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import api from "@/lib/api";
import type { StudyPlanSummary, StudyPlanDetail } from "@/types/studyplan";

const input = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600";

export default function AdminStudyPlansPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", slug: "", description: "", difficulty: "MIXED",
    icon: "📚", estimatedDays: 30, isPublished: true,
  });

  const { data: plans = [], isLoading } = useQuery<StudyPlanSummary[]>({
    queryKey: ["study-plans"],
    queryFn: () => api.get("/study-plans").then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/admin/study-plans", form).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-plans"] });
      setShowForm(false);
      setForm({ title: "", slug: "", description: "", difficulty: "MIXED", icon: "📚", estimatedDays: 30, isPublished: true });
      toast.success("Study plan created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Study Plans</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{plans.length} plans</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-300">Create Study Plan</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="text-xs text-zinc-400">Title</label><input className={input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><label className="text-xs text-zinc-400">Slug</label><input className={input} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="blind-75" /></div>
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Difficulty</label>
              <select className={input} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                {["EASY","MEDIUM","HARD","MIXED"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><label className="text-xs text-zinc-400">Est. Days</label><input className={input} type="number" value={form.estimatedDays} onChange={e => setForm(f => ({ ...f, estimatedDays: +e.target.value }))} /></div>
            <div className="space-y-1.5"><label className="text-xs text-zinc-400">Icon (emoji)</label><input className={input} value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} /></div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="rounded" />
                Published
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
              disabled={createMutation.isPending || !form.title || !form.slug}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-zinc-800/40 animate-pulse rounded-xl" />)
          : plans.map(plan => (
              <PlanRow
                key={plan.slug}
                plan={plan}
                expanded={expanded === plan.slug}
                onToggle={() => setExpanded(e => e === plan.slug ? null : plan.slug)}
              />
            ))}
      </div>
    </div>
  );
}

function PlanRow({ plan, expanded, onToggle }: { plan: StudyPlanSummary; expanded: boolean; onToggle: () => void }) {
  const qc = useQueryClient();

  const { data: detail } = useQuery<StudyPlanDetail>({
    queryKey: ["study-plan-detail", plan.slug],
    queryFn: () => api.get(`/study-plans/${plan.slug}`).then(r => r.data),
    enabled: expanded,
  });

  const [newProblemId, setNewProblemId] = useState("");
  const [newAlias, setNewAlias] = useState("");

  const addMutation = useMutation({
    mutationFn: () => api.post(`/admin/study-plans/${plan.slug}/problems`, {
      problemId: parseInt(newProblemId),
      orderIndex: detail?.problems.length ?? 0,
      alias: newAlias || undefined,
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study-plan-detail", plan.slug] });
      setNewProblemId(""); setNewAlias("");
      toast.success("Problem added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (problemId: number) => api.delete(`/admin/study-plans/${plan.slug}/problems/${problemId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["study-plan-detail", plan.slug] }); toast.success("Removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 bg-zinc-900/50 hover:bg-zinc-900 transition-colors text-left"
      >
        <span className="text-xl">{plan.icon ?? "📚"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100">{plan.title}</p>
          <p className="text-xs text-zinc-500">{plan.problemCount} problems · {plan.difficulty.toLowerCase()}</p>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/40 p-5 space-y-4">
          {/* Add problem */}
          <div className="flex items-end gap-3">
            <div className="space-y-1.5 flex-1">
              <label className="text-xs text-zinc-400">Problem ID</label>
              <input className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                type="number" value={newProblemId} onChange={e => setNewProblemId(e.target.value)} placeholder="123" />
            </div>
            <button
              onClick={() => addMutation.mutate()}
              disabled={!newProblemId || addMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />Add
            </button>
          </div>

          {/* Problem list */}
          {detail?.problems.map(p => (
            <div key={p.problemId} className="flex items-center gap-3 text-sm group">
              <span className="text-zinc-600 font-mono text-xs w-5 text-right">{p.orderIndex + 1}.</span>
              <span className="flex-1 text-zinc-300">{p.title}</span>
              <button
                onClick={() => removeMutation.mutate(p.problemId)}
                className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
