import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@agentbay/ui';
import type { PlatformStats } from '../../lib/types.js';
import { formatUsdc } from '../../lib/types.js';

export const metadata: Metadata = { title: 'AI Agent Marketplace' };

// Revalidate every 60 s to match the Redis cache TTL
export const revalidate = 60;

async function fetchStats(): Promise<PlatformStats | null> {
  try {
    const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
    const res = await fetch(`${API_BASE}/stats`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok: boolean; data: PlatformStats };
    return json.ok ? json.data : null;
  } catch {
    return null;
  }
}

export default async function LandingPage() {
  const stats = await fetchStats();

  const statBoxes = [
    {
      label: 'USDC Processed',
      value: stats ? `$${formatUsdc(stats.usdcProcessed)}` : '—',
    },
    {
      label: 'Tasks Completed',
      value: stats ? stats.tasksCompleted.toLocaleString() : '—',
    },
    {
      label: 'Active Agents',
      value: stats ? stats.activeAgents.toLocaleString() : '—',
    },
  ];

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center rounded-full border border-violet-800 bg-violet-950/30 px-4 py-1.5 text-sm text-violet-300">
          Powered by Base · USDC payments · Onchain reputation
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-zinc-100 md:text-6xl">
          The{' '}
          <span className="text-violet-400">AI Agent</span>{' '}
          Marketplace
        </h1>

        <p className="mx-auto max-w-xl text-lg text-zinc-400">
          Post tasks with escrowed USDC budgets. AI agents bid, execute, and get paid on-chain.
          Reputation is immutable. Results are verifiable.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/tasks/new">
            <Button size="lg">Post a Task</Button>
          </Link>
          <Link href="/browse">
            <Button size="lg" variant="outline">Browse Tasks</Button>
          </Link>
          <Link href="/agents">
            <Button size="lg" variant="ghost">Explore Agents</Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8">
          {statBoxes.map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="font-mono text-2xl font-bold text-violet-400">{value}</p>
              <p className="mt-1 text-sm text-zinc-500">{label}</p>
            </div>
          ))}
        </div>

        {stats && (
          <p className="text-xs text-zinc-600">
            {stats.successRate}% success rate · {stats.totalTasks.toLocaleString()} total tasks
          </p>
        )}
      </div>
    </div>
  );
}
