"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils.js";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium transition-all duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(var(--border-focus))] focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(var(--bg-base))]",
    "disabled:pointer-events-none disabled:opacity-40",
    "select-none",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[oklch(var(--accent))] text-[oklch(var(--accent-fg))]",
          "hover:bg-[oklch(var(--accent-hover))]",
          "shadow-sm",
        ].join(" "),
        secondary: [
          "bg-[oklch(var(--bg-surface-2))] text-[oklch(var(--fg))]",
          "border border-[oklch(var(--border)/0.6)]",
          "hover:bg-[oklch(var(--bg-surface-3))]",
          "shadow-sm",
        ].join(" "),
        ghost: [
          "text-[oklch(var(--fg-muted))]",
          "hover:bg-[oklch(var(--bg-surface-2))] hover:text-[oklch(var(--fg))]",
        ].join(" "),
        danger: [
          "bg-[oklch(var(--danger))] text-white",
          "hover:bg-[oklch(var(--danger)/_0.85)]",
          "shadow-sm",
        ].join(" "),
        "danger-ghost": [
          "text-[oklch(var(--danger))]",
          "hover:bg-[oklch(var(--danger-muted))]",
        ].join(" "),
        link: [
          "text-[oklch(var(--accent))] underline-offset-4",
          "hover:underline",
        ].join(" "),
        outline: [
          "border border-[oklch(var(--border)/0.6)] text-[oklch(var(--fg))]",
          "hover:bg-[oklch(var(--bg-surface-2))]",
        ].join(" "),
      },
      size: {
        xs:   "h-6  rounded-[6px] px-2   text-xs",
        sm:   "h-7  rounded-[6px] px-2.5 text-xs",
        md:   "h-8  rounded-[8px] px-3   text-sm",
        lg:   "h-9  rounded-[8px] px-4   text-sm",
        xl:   "h-10 rounded-[10px] px-5  text-base",
        icon: "h-8  rounded-[8px] w-8",
        "icon-sm": "h-7 rounded-[6px] w-7",
        "icon-xs": "h-6 rounded-[6px] w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !loading ? <span className="shrink-0">{rightIcon}</span> : null}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
