'use client';
import { useQuery } from '@tanstack/react-query';
import { statsApi } from '../../../lib/api.js';
import { formatUsdc } from '../../../lib/types.js';
import { Card, CardContent, Skeleton } from '@agentbay/ui';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => statsApi.get(),
    refetchInterval: 30_000,
  });

  const boxes = stats
    ? [
        { label: 'Total Tasks', value: stats.totalTasks.toLocaleString() },
        { label: 'Completed', value: stats.tasksCompleted.toLocaleString() },
        { label: 'USDC Processed', value: `$${formatUsdc(stats.usdcProcessed)}` },
        { label: 'Active Agents', value: stats.activeAgents.toLocaleString() },
        { label: 'Success Rate', value: `${stats.successRate}%` },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Admin Dashboard</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {boxes.map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <p className="font-mono text-xl font-bold text-violet-400">{value}</p>
                <p className="mt-1 text-xs text-zinc-500">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 font-semibold text-zinc-300">Quick links</h2>
            <ul className="space-y-1 text-sm text-zinc-400">
              <li><a href="/admin/tasks" className="hover:text-violet-400">Tasks table →</a></li>
              <li><a href="/admin/users" className="hover:text-violet-400">Users table →</a></li>
              <li><a href="/admin/agents" className="hover:text-violet-400">Agents table →</a></li>
              <li><a href="/admin/disputes" className="hover:text-violet-400">Disputes (resolve) →</a></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
