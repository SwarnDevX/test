"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GitBranch, Play, CheckCircle2, XCircle, Clock, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatRelative, formatDuration, formatCost } from "@/lib/utils";

const spring = { ease: [0.32, 0.72, 0, 1] as const, duration: 0.3 };

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: React.ElementType; trend?: string }) {
  return (
    <div className="p-4 rounded-xl border border-border/60 bg-bg-surface-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-fg-muted">{label}</span>
        <Icon className="w-4 h-4 text-fg-muted" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && <div className="text-xs text-success mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{trend}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { data: workflows } = trpc.workflow.list.useQuery({ pageSize: 5 });
  const { data: executions } = trpc.execution.list.useQuery({ pageSize: 10 });

  const stats = {
    totalWorkflows: workflows?.total ?? 0,
    totalRuns: executions?.total ?? 0,
    successRate:
      executions?.items?.length
        ? Math.round((executions.items.filter((e) => e.status === "SUCCESS").length / executions.items.length) * 100)
        : 0,
    totalCost: executions?.items?.reduce((sum, e) => sum + Number(e.totalCostUsd ?? 0), 0) ?? 0,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-fg-muted mt-0.5">Overview of your workspace</p>
        </div>
        <Link
          href="/workflows"
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          New workflow
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0 }}>
          <StatCard label="Workflows" value={String(stats.totalWorkflows)} icon={GitBranch} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}>
          <StatCard label="Total runs" value={String(stats.totalRuns)} icon={Play} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}>
          <StatCard label="Success rate" value={`${stats.successRate}%`} icon={CheckCircle2} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 }}>
          <StatCard label="LLM cost" value={formatCost(stats.totalCost)} icon={TrendingUp} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent workflows */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent workflows</h2>
            <Link href="/workflows" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {workflows?.items?.map((wf) => (
              <Link
                key={wf.id}
                href={`/workflows/${wf.id}`}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-bg-surface-1 hover:bg-bg-surface-2 transition-colors group"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${wf.isActive ? "bg-success" : "bg-fg-muted/30"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{wf.name}</div>
                  <div className="text-xs text-fg-muted">{formatRelative(wf.updatedAt)}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-fg-muted group-hover:text-fg transition-colors" />
              </Link>
            ))}
            {!workflows?.items?.length && (
              <div className="p-8 text-center rounded-lg border border-dashed border-border/60">
                <GitBranch className="w-8 h-8 text-fg-muted/40 mx-auto mb-2" />
                <p className="text-sm text-fg-muted">No workflows yet</p>
                <Link href="/workflows" className="text-xs text-accent hover:underline mt-1 inline-block">
                  Create your first
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent executions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent executions</h2>
            <Link href="/executions" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {executions?.items?.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-bg-surface-1"
              >
                {ex.status === "SUCCESS" ? (
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                ) : ex.status === "FAILED" ? (
                  <XCircle className="w-4 h-4 text-danger flex-shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-warning flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{ex.workflowId}</div>
                  <div className="text-xs text-fg-muted">
                    {formatRelative(ex.createdAt)} · {ex.completedAt ? formatDuration(new Date(ex.completedAt).getTime() - new Date(ex.createdAt).getTime()) : "—"}
                  </div>
                </div>
                {ex.totalCostUsd ? (
                  <span className="text-xs text-fg-muted">{formatCost(Number(ex.totalCostUsd))}</span>
                ) : null}
              </div>
            ))}
            {!executions?.items?.length && (
              <div className="p-8 text-center rounded-lg border border-dashed border-border/60">
                <Play className="w-8 h-8 text-fg-muted/40 mx-auto mb-2" />
                <p className="text-sm text-fg-muted">No executions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
