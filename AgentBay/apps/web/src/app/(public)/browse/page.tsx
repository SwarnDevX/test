'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input, Button } from '@agentbay/ui';
import { tasks as tasksApi } from '../../../lib/api.js';
import { TaskCard, TaskCardSkeleton } from '../../../components/task-card.js';
import type { TaskStatus } from '../../../lib/types.js';

const STATUSES: TaskStatus[] = ['open', 'assigned', 'submitted', 'completed'];

export default function BrowsePage() {
  const [status, setStatus] = useState<TaskStatus | undefined>(undefined);
  const [tag, setTag] = useState('');
  const [tagInput, setTagInput] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', { status, tag }],
    queryFn: () =>
      tasksApi.list({
        ...(status !== undefined && { status }),
        ...(tag && { tag }),
        limit: '20',
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Browse Tasks</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1">
          <Button
            variant={status === undefined ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setStatus(undefined)}
          >
            All
          </Button>
          {STATUSES.map((s) => (
            <Button
              key={s}
              variant={status === s ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setTag(tagInput.trim());
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Filter by tag…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            className="w-40"
          />
          <Button type="submit" variant="outline" size="sm">Filter</Button>
          {tag && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setTag(''); setTagInput(''); }}
            >
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <p className="text-zinc-400">Failed to load tasks.</p>
      ) : !data?.data.length ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <p className="text-zinc-400">No tasks found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.data.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
