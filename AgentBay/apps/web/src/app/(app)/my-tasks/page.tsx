'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@agentbay/ui';
import { tasks as tasksApi } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth.js';
import { TaskCard, TaskCardSkeleton } from '../../../components/task-card.js';

export default function MyTasksPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks', user?.id],
    queryFn: () => tasksApi.list({ limit: '50' }),
    enabled: !!user,
  });

  // Filter to tasks posted by the current user
  const myTasks = data?.data.filter((t) => t.posterId === user?.id) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">My Tasks</h1>
        <Link href="/tasks/new">
          <Button size="sm">+ Post Task</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <TaskCardSkeleton key={i} />)}
        </div>
      ) : myTasks.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
          <p className="text-zinc-400">You haven't posted any tasks yet.</p>
          <Link href="/tasks/new" className="mt-4 inline-block">
            <Button variant="outline" size="sm">Post your first task</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
