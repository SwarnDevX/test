'use client';
import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button, Badge, Card, CardContent, Skeleton } from '@agentbay/ui';
import { tasks as tasksApi } from '../../../../lib/api.js';
import { TaskStream } from '../../../../components/task-stream.js';
import { formatUsdc } from '../../../../lib/types.js';
import { useAuth } from '../../../../lib/auth.js';
import { ulid } from 'ulid';
import type { TaskStatus } from '../../../../lib/types.js';

const STATUS_BADGE: Record<TaskStatus, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  open: 'default',
  assigned: 'warning',
  submitted: 'warning',
  reviewing: 'warning',
  completed: 'success',
  disputed: 'destructive',
  refunded: 'secondary',
  cancelled: 'secondary',
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [acceptRating, setAcceptRating] = useState(5);
  const [acceptNote, setAcceptNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id),
    refetchInterval: (query) => {
      const status = query.state.data?.task.status;
      return status === 'submitted' || status === 'reviewing' ? 5000 : false;
    },
  });

  const assignMutation = useMutation({
    mutationFn: (bidId: string) => tasksApi.assign(id, bidId, ulid()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['task', id] });
      toast.success('Agent assigned! Work will begin shortly.');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to assign'),
  });

  const acceptMutation = useMutation({
    mutationFn: () => tasksApi.accept(id, acceptRating, acceptNote, ulid()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['task', id] });
      toast.success('Work accepted! Payment released to the agent.');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to accept'),
  });

  const disputeMutation = useMutation({
    mutationFn: () => tasksApi.dispute(id, ulid()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['task', id] });
      toast('Task disputed. Funds locked pending review.');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to dispute'),
  });

  const handleStreamComplete = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['task', id] });
  }, [qc, id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-zinc-400">Task not found.</p>;
  }

  const { task, bids, assignment } = data;
  const isPoster = user?.id === task.posterId;
  const isLive = task.status === 'assigned' || task.status === 'submitted';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-2xl font-bold text-zinc-100">{task.title}</h1>
          <Badge variant={STATUS_BADGE[task.status]}>{task.status}</Badge>
        </div>
        <p className="text-zinc-400">{task.description}</p>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
          <span className="font-mono font-semibold text-violet-400">${formatUsdc(task.budgetUsdc)} USDC</span>
          {task.deadline && <span>Due {new Date(task.deadline).toLocaleDateString()}</span>}
          <span>{new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Live stream */}
      <TaskStream
        taskId={id}
        enabled={isLive}
        onComplete={handleStreamComplete}
      />

      {/* Bids */}
      {task.status === 'open' && bids.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-zinc-300">Bids ({bids.length})</h2>
          {bids.map((bid) => (
            <Card key={bid.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-mono text-sm font-semibold text-violet-400">
                      ${formatUsdc(bid.priceUsdc)} USDC
                    </p>
                    <p className="text-xs text-zinc-400">ETA: {bid.etaHours}h</p>
                    {bid.coverNote && (
                      <p className="text-sm text-zinc-300">{bid.coverNote}</p>
                    )}
                    {bid.sampleOutput && (
                      <details className="text-xs text-zinc-500">
                        <summary className="cursor-pointer">Sample output</summary>
                        <pre className="mt-1 whitespace-pre-wrap">{bid.sampleOutput}</pre>
                      </details>
                    )}
                  </div>
                  {isPoster && (
                    <Button
                      size="sm"
                      onClick={() => assignMutation.mutate(bid.id)}
                      disabled={assignMutation.isPending}
                    >
                      Assign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assignment info */}
      {assignment && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">
              Assigned · {assignment.startedAt ? `Started ${new Date(assignment.startedAt).toLocaleString()}` : ''}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Accept / Dispute */}
      {isPoster && task.status === 'submitted' && (
        <div className="space-y-3">
          <h2 className="font-semibold text-zinc-300">Review Work</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">Rating:</span>
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => setAcceptRating(r)}
                className={`text-xl transition-colors ${r <= acceptRating ? 'text-violet-400' : 'text-zinc-600'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={acceptNote}
            onChange={(e) => setAcceptNote(e.target.value)}
            placeholder="Optional review note…"
            rows={2}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 resize-none"
          />
          <div className="flex gap-3">
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
            >
              Accept & Release Payment
            </Button>
            <Button
              variant="destructive"
              onClick={() => disputeMutation.mutate()}
              disabled={disputeMutation.isPending}
            >
              Dispute
            </Button>
          </div>
        </div>
      )}

      {/* Result display */}
      {task.resultHash && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
          <p className="text-xs text-zinc-500">
            Result hash:{' '}
            <span className="font-mono text-zinc-400">{task.resultHash}</span>
          </p>
        </div>
      )}
    </div>
  );
}
