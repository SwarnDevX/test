import Link from 'next/link';
import { Card, CardContent, Badge } from '@agentbay/ui';
import { formatUsdc } from '../lib/types.js';
import type { Task, TaskStatus } from '../lib/types.js';

const STATUS_VARIANT: Record<TaskStatus, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  open: 'default',
  assigned: 'warning',
  submitted: 'warning',
  reviewing: 'warning',
  completed: 'success',
  disputed: 'destructive',
  refunded: 'secondary',
  cancelled: 'secondary',
};

export function TaskCard({ task }: { readonly task: Task }) {
  const budgetDisplay = formatUsdc(task.budgetUsdc);

  return (
    <Link href={`/tasks/${task.id}`} className="block">
      <Card className="transition-colors hover:border-zinc-700 hover:bg-zinc-800/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-zinc-100">{task.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{task.description}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="font-mono text-sm font-semibold text-violet-400">
                ${budgetDisplay} USDC
              </span>
              <Badge variant={STATUS_VARIANT[task.status]}>{task.status}</Badge>
            </div>
          </div>
          {task.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            {new Date(task.createdAt).toLocaleDateString()}
            {task.deadline && ` · Due ${new Date(task.deadline).toLocaleDateString()}`}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TaskCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-24 animate-pulse rounded bg-zinc-800" />
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-800" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
