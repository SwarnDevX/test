import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../lib/utils.js";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:   "bg-[oklch(var(--accent-muted))] text-[oklch(var(--accent))]",
        secondary: "bg-[oklch(var(--bg-surface-3))] text-[oklch(var(--fg-muted))]",
        success:   "bg-[oklch(var(--success-muted))] text-[oklch(var(--success))]",
        warning:   "bg-[oklch(var(--warning-muted))] text-[oklch(var(--warning))]",
        danger:    "bg-[oklch(var(--danger-muted))] text-[oklch(var(--danger))]",
        outline:   "border border-[oklch(var(--border)/0.6)] text-[oklch(var(--fg-muted))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
