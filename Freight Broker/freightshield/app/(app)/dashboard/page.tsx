import { currentUser } from '@clerk/nextjs/server'
import { Truck, Bell, ClipboardCheck, BarChart3, ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/glass-card'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const quickActions = [
  {
    href: '/dashboard/lookup',
    icon: Search,
    title: 'Look up a carrier',
    description: 'Enter MC# or DOT# for instant FMCSA data and risk score.',
    accent: 'var(--accent)',
  },
  {
    href: '/dashboard/carriers',
    icon: Truck,
    title: 'View your carriers',
    description: 'Your monitored carrier list — sortable, filterable, exportable.',
    accent: 'var(--success)',
  },
  {
    href: '/dashboard/alerts',
    icon: Bell,
    title: 'Check alerts',
    description: 'Authority revocations, insurance lapses, and CSA score changes.',
    accent: 'var(--warning)',
  },
  {
    href: '/dashboard/onboarding',
    icon: ClipboardCheck,
    title: 'Onboard a carrier',
    description: 'Send a tokenized portal link for COI, W-9, and e-signature.',
    accent: 'var(--info)',
  },
]

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName ?? 'there'

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <h2
          className="text-2xl font-semibold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {getGreeting()}, {firstName}.
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your compliance command center is ready.
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Quick actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.href} href={action.href} className="group block">
              <GlassCard
                className="p-5 flex flex-col gap-3 cursor-pointer h-full group-hover:bg-[var(--surface-2)] transition-colors duration-200"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${action.accent}1a` }}
                >
                  <Icon size={18} style={{ color: action.accent }} strokeWidth={1.75} />
                </div>
                <div>
                  <div
                    className="text-sm font-medium mb-0.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {action.title}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                    {action.description}
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-tertiary)' }}
                />
              </GlassCard>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      <GlassCard className="py-16 px-8 text-center">
        <BarChart3
          size={40}
          className="mx-auto mb-4"
          style={{ color: 'var(--text-disabled)', opacity: 0.4 }}
          strokeWidth={1}
        />
        <h3
          className="text-sm font-medium mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          No carriers monitored yet
        </h3>
        <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-tertiary)' }}>
          Add your first carrier using the lookup tool above. Most brokerages import their full
          list in under 10 minutes.
        </p>
      </GlassCard>
    </div>
  )
}
