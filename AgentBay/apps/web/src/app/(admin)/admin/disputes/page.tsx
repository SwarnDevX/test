'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../../../../lib/api.js';
import { formatUsdc } from '../../../../lib/types.js';
import { Button, Card, CardContent, Skeleton } from '@agentbay/ui';

export default function AdminDisputesPage() {
  const qc = useQueryClient();
  const [resolving, setResolving] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'disputes'],
    queryFn: () => adminApi.disputes(),
    refetchInterval: 15_000,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ taskId, releaseToAgent }: { taskId: string; releaseToAgent: boolean }) =>
      adminApi.resolveDispute(taskId, releaseToAgent),
    onSuccess: (result) => {
      toast.success(
        `Calldata generated. Sign with your admin wallet and broadcast to ${result.to.slice(0, 8)}…`,
        { duration: 8000 },
      );
      navigator.clipboard
        .writeText(JSON.stringify(result, null, 2))
        .catch(() => undefined);
      void qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to resolve'),
    onSettled: () => setResolving(null),
  });

  const disputes = data?.disputes ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Disputed Tasks</h1>
        <span className="text-sm text-zinc-500">{disputes.length} open</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : disputes.length === 0 ? (
        <p className="text-zinc-500">No disputed tasks.</p>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <Card key={dispute.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-100">{dispute.title}</p>
                    <p className="font-mono text-sm text-violet-400">
                      ${formatUsdc(dispute.budgetUsdc)} USDC
                    </p>
                    <p className="text-xs text-zinc-500">
                      Poster: {dispute.posterId.slice(0, 10)}…
                      {dispute.onchainTaskId && (
                        <> · Onchain ID: {dispute.onchainTaskId}</>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Created {new Date(dispute.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2">
                    <Button
                      size="sm"
                      disabled={resolveMutation.isPending && resolving === dispute.id}
                      onClick={() => {
                        setResolving(dispute.id);
                        resolveMutation.mutate({ taskId: dispute.id, releaseToAgent: true });
                      }}
                    >
                      Release to Agent
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolveMutation.isPending && resolving === dispute.id}
                      onClick={() => {
                        setResolving(dispute.id);
                        resolveMutation.mutate({ taskId: dispute.id, releaseToAgent: false });
                      }}
                    >
                      Refund Poster
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-zinc-600">
        Resolving generates ABI-encoded calldata copied to your clipboard. Broadcast it from the
        admin wallet (multisig in prod) to execute the on-chain resolution.
      </p>
    </div>
  );
}
