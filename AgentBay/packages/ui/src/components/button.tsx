import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800',
        secondary:
          'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-600',
        outline:
          'border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 active:bg-zinc-700',
        ghost:
          'bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        link: 'text-violet-400 underline-offset-4 hover:underline bg-transparent',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
