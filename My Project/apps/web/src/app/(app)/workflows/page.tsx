"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GitBranch, Plus, Search, Play, Pause, Trash2, Copy, MoreHorizontal, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

const spring = { ease: [0.32, 0.72, 0, 1] as const, duration: 0.25 };

export default function WorkflowsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = trpc.workflow.list.useQuery({ search: search || undefined, pageSize: 50 });

  const deleteMutation = trpc.workflow.delete.useMutation({ onSuccess: () => refetch() });
  const duplicateMutation = trpc.workflow.duplicate.useMutation({ onSuccess: () => refetch() });
  const updateMutation = trpc.workflow.update.useMutation({ onSuccess: () => refetch() });

  const workflows = data?.items ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-sm text-fg-muted mt-0.5">{data?.total ?? 0} workflows</p>
        </div>
        <Link
          href="/workflows/new"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-all active:scale-[0.97]"
        >
          <Plus className="w-4 h-4" />
          New workflow
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workflows…"
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/60 bg-bg-surface-1 text-sm placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-bg-surface-1 animate-pulse" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="py-20 text-center">
          <GitBranch className="w-12 h-12 text-fg-muted/30 mx-auto mb-4" />
          <h3 className="font-medium mb-2">No workflows yet</h3>
          <p className="text-sm text-fg-muted mb-4">Create your first workflow to get started.</p>
          <Link
            href="/workflows/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New workflow
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map((wf, i) => (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.03 }}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-bg-surface-1 hover:bg-bg-surface-2 transition-colors group"
            >
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", wf.isActive ? "bg-success" : "bg-fg-muted/30")} />

              <Link href={`/workflows/${wf.id}`} className="flex-1 min-w-0">
                <div className="font-medium text-sm">{wf.name}</div>
                <div className="text-xs text-fg-muted mt-0.5">
                  Updated {formatRelative(wf.updatedAt)}
                  {wf.description ? ` · ${wf.description}` : ""}
                </div>
              </Link>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => updateMutation.mutate({ id: wf.id, isActive: !wf.isActive })}
                  className="p-1.5 rounded hover:bg-bg-surface-3 text-fg-muted hover:text-fg transition-colors"
                  title={wf.isActive ? "Pause" : "Activate"}
                >
                  {wf.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => duplicateMutation.mutate({ id: wf.id })}
                  className="p-1.5 rounded hover:bg-bg-surface-3 text-fg-muted hover:text-fg transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this workflow?")) deleteMutation.mutate({ id: wf.id });
                  }}
                  className="p-1.5 rounded hover:bg-danger/10 text-fg-muted hover:text-danger transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <Link
                  href={`/workflows/${wf.id}`}
                  className="p-1.5 rounded hover:bg-bg-surface-3 text-fg-muted hover:text-fg transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
