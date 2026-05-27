"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "../lib/utils.js";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full",
      "border-2 border-transparent",
      "transition-colors duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(var(--border-focus))] focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(var(--bg-base))]",
      "disabled:cursor-not-allowed disabled:opacity-40",
      "data-[state=checked]:bg-[oklch(var(--accent))]",
      "data-[state=unchecked]:bg-[oklch(var(--bg-surface-4))]",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm",
        "ring-0",
        "transition-transform duration-150 ease-[cubic-bezier(0.32,0.72,0,1)]",
        "data-[state=checked]:translate-x-4",
        "data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
