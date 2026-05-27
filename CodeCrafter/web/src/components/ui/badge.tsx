import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:  "border-transparent bg-zinc-800 text-zinc-200",
        easy:     "border-transparent bg-emerald-900/50 text-emerald-400",
        medium:   "border-transparent bg-amber-900/50 text-amber-400",
        hard:     "border-transparent bg-red-900/50 text-red-400",
        outline:  "border-zinc-700 text-zinc-300",
        tag:      "border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 cursor-pointer",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
