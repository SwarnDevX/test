import * as React from "react";

import { cn } from "../lib/utils.js";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftAdornment, rightAdornment, error, ...props }, ref) => {
    if (leftAdornment || rightAdornment) {
      return (
        <div className="relative flex items-center">
          {leftAdornment && (
            <span className="absolute left-2.5 flex items-center text-[oklch(var(--fg-muted))]">
              {leftAdornment}
            </span>
          )}
          <input
            type={type}
            className={cn(
              "flex h-8 w-full rounded-[8px] border border-[oklch(var(--border)/0.6)] bg-[oklch(var(--bg-surface-2))]",
              "px-3 py-1.5 text-sm text-[oklch(var(--fg))]",
              "placeholder:text-[oklch(var(--fg-muted))]",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(var(--border-focus))]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              error && "border-[oklch(var(--danger))] focus-visible:ring-[oklch(var(--danger))]",
              leftAdornment && "pl-8",
              rightAdornment && "pr-8",
              className,
            )}
            ref={ref}
            {...props}
          />
          {rightAdornment && (
            <span className="absolute right-2.5 flex items-center text-[oklch(var(--fg-muted))]">
              {rightAdornment}
            </span>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-[8px] border border-[oklch(var(--border)/0.6)] bg-[oklch(var(--bg-surface-2))]",
          "px-3 py-1.5 text-sm text-[oklch(var(--fg))]",
          "placeholder:text-[oklch(var(--fg-muted))]",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(var(--border-focus))]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          error && "border-[oklch(var(--danger))] focus-visible:ring-[oklch(var(--danger))]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[8px] border border-[oklch(var(--border)/0.6)] bg-[oklch(var(--bg-surface-2))]",
          "px-3 py-2 text-sm text-[oklch(var(--fg))]",
          "placeholder:text-[oklch(var(--fg-muted))]",
          "transition-colors duration-150 resize-vertical",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(var(--border-focus))]",
          "disabled:cursor-not-allowed disabled:opacity-40",
          error && "border-[oklch(var(--danger))] focus-visible:ring-[oklch(var(--danger))]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
