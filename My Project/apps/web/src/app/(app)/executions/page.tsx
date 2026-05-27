"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Play, Search, Filter, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatRelative, formatDuration, formatCost, cn } from "@/lib/utils";

const STATUS_CONFIG = {
  SUCCESS: { icon: CheckCircle2, color: "text-success", label: "Success" },
  FAILED: { icon: XCircle, color: "text-danger", label: "Failed" },
  RUNNING: { icon: Play, color: "text-accent", label: "Running" },
  PENDING: { icon: Clock, color: "text-warning", label: "Pending" },
  CANCELLED: { icon: XCircle, color: "text-fg-muted", label: "Cancelled" },
} as const;

export default function ExecutionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data, isLoading } = trpc.execution.list.useQuery({
    pageSize: 50,
    status: statusFilter as "SUCCESS" | "FAILED" | "RUNNING" | "PENDING" | undefined || undefined,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Executions</h1>
          <p className="text-sm text-fg-muted mt-0.5">{data?.total ?? 0} total</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by workflow…"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/60 bg-bg-surface-1 text-sm placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-1 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-bg-surface-1 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-bg-surface-1">
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted">Workflow</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted">Trigger</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted">Cost</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-fg-muted">When</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data?.items?.map((ex) => {
                const cfg = STATUS_CONFIG[ex.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
                const Icon = cfg.icon;
                return (
                  <tr key={ex.id} className="bg-bg-surface-1 hover:bg-bg-surface-2 transition-colors">
                    <td className="px-4 py-3">
                      <div className={cn("flex items-center gap-1.5", cfg.color)}>
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{cfg.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{ex.workflowId}</td>
                    <td className="px-4 py-3 text-fg-muted capitalize">{ex.trigger ?? "manual"}</td>
                    <td className="px-4 py-3 text-fg-muted">{ex.completedAt ? formatDuration(new Date(ex.completedAt).getTime() - new Date(ex.createdAt).getTime()) : "—"}</td>
                    <td className="px-4 py-3 text-fg-muted">{ex.totalCostUsd ? formatCost(Number(ex.totalCostUsd)) : "—"}</td>
                    <td className="px-4 py-3 text-fg-muted">{formatRelative(ex.createdAt)}</td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-fg-muted" />
                    </td>
                  </tr>
                );
              })}
              {!data?.items?.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-fg-muted">
                    No executions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
