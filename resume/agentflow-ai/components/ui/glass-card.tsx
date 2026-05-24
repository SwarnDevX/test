'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'violet' | 'cyan' | 'none';
  onClick?: () => void;
}

export function GlassCard({ children, className, hover = false, glow = 'none', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass',
        hover && 'glass-hover cursor-pointer',
        glow === 'violet' && 'glow-violet',
        glow === 'cyan' && 'glow-cyan',
        className
      )}
    >
      {children}
    </div>
  );
}

export function GlassCardStrong({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('glass-strong', className)}>
      {children}
    </div>
  );
}

