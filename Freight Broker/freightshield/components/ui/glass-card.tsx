import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  glow?: boolean
  as?: React.ElementType
}

export function GlassCard({
  children,
  className,
  glow = false,
  as: Component = 'div',
}: GlassCardProps) {
  return (
    <Component
      className={cn(
        // Base shape
        'relative rounded-2xl overflow-hidden isolate',
        // Glass surface
        'backdrop-blur-[20px] backdrop-saturate-[180%]',
        // Border
        'border',
        // Shadow
        className
      )}
      style={{
        backgroundColor: 'var(--surface-1)',
        borderColor: 'var(--border-default)',
        boxShadow: glow
          ? `var(--shadow-glass), var(--shadow-glow-accent)`
          : 'var(--shadow-glass)',
      }}
    >
      {/* Inner top-edge highlight — the "premium" feel */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.04) 0%, transparent 30%)',
        }}
        aria-hidden
      />
      <div className="relative">{children}</div>
    </Component>
  )
}
