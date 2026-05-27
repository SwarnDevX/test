import { cn } from "../lib/utils.js";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[6px] bg-[oklch(var(--bg-surface-2))]",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-[oklch(var(--bg-surface-3))] before:to-transparent",
        "before:animate-shimmer before:bg-[length:400%_100%]",
        className,
      )}
      {...props}
    />
  );
}

export function WorkflowCardSkeleton() {
  return (
    <div className="rounded-[10px] border border-[oklch(var(--border)/0.5)] bg-[oklch(var(--bg-surface-1))] p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function NodeSkeleton() {
  return (
    <div className="w-60 rounded-[10px] border border-[oklch(var(--border)/0.5)] bg-[oklch(var(--bg-surface-2))]">
      <div className="h-8 rounded-t-[10px] bg-[oklch(var(--bg-surface-3))]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export { Skeleton };
