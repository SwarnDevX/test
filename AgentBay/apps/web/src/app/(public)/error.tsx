'use client';
import { Button } from '@agentbay/ui';

export default function PublicError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-lg font-semibold text-zinc-300">Something went wrong</p>
      <p className="text-sm text-zinc-500">{error.message}</p>
      <Button variant="outline" onClick={reset}>Try again</Button>
    </div>
  );
}
