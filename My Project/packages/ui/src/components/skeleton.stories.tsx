import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./skeleton.js";

const meta: Meta = {
  title: "UI/Skeleton",
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <Skeleton className="h-4 w-48" />,
};

export const WorkflowCardSkeleton: Story = {
  render: () => (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface-1)] p-5 w-72 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  ),
};

export const TableRowSkeleton: Story = {
  render: () => (
    <div className="space-y-2 w-full max-w-xl">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2">
          <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  ),
};

export const NodeCardSkeleton: Story = {
  render: () => (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-2)] w-52 overflow-hidden">
      <Skeleton className="h-8 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  ),
};
