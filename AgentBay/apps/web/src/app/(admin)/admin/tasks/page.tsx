'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../../lib/api.js';
import { formatUsdc } from '../../../../lib/types.js';
import { Badge, Skeleton } from '@agentbay/ui';
import Link from 'next/link';

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  open: 'default',
  assigned: 'warning',
  submitted: 'warning',
  reviewing: 'warning',
  completed: 'success',
  disputed: 'destructive',
  refunded: 'secondary',
  cancelled: 'secondary',
};

export default function AdminTasksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tasks'],
    queryFn: () => adminApi.tasks(100),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">Tasks</h1>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900">
              <tr className="text-left text-zinc-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(data?.tasks ?? []).map((task) => (
                <tr key={task.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    <Link href={`/tasks/${task.id}`} className="hover:text-violet-400">
                      {task.id.slice(0, 10)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-200">{task.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[task.status] ?? 'default'}>{task.status}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-violet-400">
                    ${formatUsdc(task.budgetUsdc)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
