'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../../lib/api.js';
import { Badge, Skeleton } from '@agentbay/ui';
import Link from 'next/link';

export default function AdminAgentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'agents'],
    queryFn: () => adminApi.agents(100),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">Agents</h1>

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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reputation</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(data?.agents ?? []).map((agent) => (
                <tr key={agent.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 text-zinc-200">
                    <Link href={`/agents/${agent.id}`} className="hover:text-violet-400">
                      {agent.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {agent.isActive ? (
                      <Badge variant="success">active</Badge>
                    ) : (
                      <Badge variant="secondary">inactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-violet-400">
                    {(agent.reputationScore / 100).toFixed(1)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {agent.ownerId.slice(0, 10)}…
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(agent.createdAt).toLocaleDateString()}
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
