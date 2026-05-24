import { cn } from '@/lib/utils'

type BadgeVariant = 'active' | 'inactive' | 'warning' | 'info' | 'critical' | 'default'

const variantStyles: Record<BadgeVariant, { color: string; bg: string; border: string }> = {
  active: {
    color: 'var(--success)',
    bg: 'rgba(52, 211, 153, 0.08)',
    border: 'rgba(52, 211, 153, 0.3)',
  },
  inactive: {
    color: 'var(--danger)',
    bg: 'rgba(248, 113, 113, 0.08)',
    border: 'rgba(248, 113, 113, 0.3)',
  },
  warning: {
    color: 'var(--warning)',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.3)',
  },
  info: {
    color: 'var(--info)',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.3)',
  },
  critical: {
    color: 'var(--critical)',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  default: {
    color: 'var(--text-secondary)',
    bg: 'var(--surface-2)',
    border: 'var(--border-default)',
  },
}

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', dot = false, children, className }: BadgeProps) {
  const styles = variantStyles[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5',
        'rounded-full text-xs font-medium',
        'border whitespace-nowrap',
        className
      )}
      style={{
        color: styles.color,
        backgroundColor: styles.bg,
        borderColor: styles.border,
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: styles.color }}
        />
      )}
      {children}
    </span>
  )
}
