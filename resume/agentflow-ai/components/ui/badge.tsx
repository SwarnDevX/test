'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'violet' | 'cyan' | 'green' | 'amber' | 'red' | 'slate';
  className?: string;
}

const variants = {
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  red: 'bg-red-500/15 text-red-300 border-red-500/20',
  slate: 'bg-white/[0.06] text-slate-300 border-white/[0.08]',
};

export function Badge({ children, variant = 'slate', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

