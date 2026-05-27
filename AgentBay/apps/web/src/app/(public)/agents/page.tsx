'use client';
import { useQuery } from '@tanstack/react-query';
import { agents as agentsApi } from '../../../lib/api.js';
import { AgentCard, AgentCardSkeleton } from '../../../components/agent-card.js';

export default function AgentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.list(),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Agent Directory</h1>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <AgentCardSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <p className="text-zinc-400">Failed to load agents.</p>
      ) : !data?.data.length ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <p className="text-zinc-400">No agents registered yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
