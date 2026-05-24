import Link from 'next/link'
import { SignUpButton, SignInButton } from '@clerk/nextjs'
import { Shield, Truck, Bell, BarChart3, CheckCircle2, ArrowRight, Zap } from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ── Marketing site — clean conversion design, glass only for pricing cards ──

const stats = [
  { value: '$400K+', label: 'avg annual fraud loss per brokerage (TIA)' },
  { value: '1 in 7', label: 'carriers has an active compliance issue' },
  { value: '72 hrs', label: 'avg detection delay without monitoring' },
]

const steps = [
  {
    icon: Truck,
    step: '01',
    title: 'Look up any carrier',
    description: 'Enter MC# or DOT# and get a full FMCSA snapshot with risk score in under 5 seconds.',
  },
  {
    icon: Bell,
    step: '02',
    title: 'Monitor continuously',
    description: 'Every carrier on your list is checked nightly. Authority revoked? Insurance lapsed? You hear about it first.',
  },
  {
    icon: BarChart3,
    step: '03',
    title: 'Automate onboarding',
    description: 'Send a tokenized portal link. Carriers upload COI and W-9 and e-sign your agreement. Done in 8 minutes.',
  },
]

const tiers = [
  {
    name: 'Solo',
    price: '$79',
    period: '/mo',
    description: 'For independent brokers booking under 100 loads/month.',
    highlight: false,
    features: [
      '1 user',
      'Monitor 50 carriers',
      'FMCSA lookup + risk scores',
      'Email alerts',
      'CSV export',
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Brokerage',
    price: '$149',
    period: '/mo',
    description: 'For small agencies ready to replace their carrier spreadsheet.',
    highlight: true,
    badge: 'Most Popular',
    features: [
      '5 users',
      'Monitor 500 carriers',
      'Everything in Solo',
      'SMS alerts',
      'Branded onboarding portal',
      'Bulk actions + saved views',
    ],
    cta: 'Start free trial',
  },
  {
    name: 'Agency',
    price: '$299',
    period: '/mo',
    description: 'For multi-agent agencies that need white-label and custom rules.',
    highlight: false,
    features: [
      '15 users',
      'Unlimited carriers',
      'Everything in Brokerage',
      'White-label portal',
      'Custom risk rules',
      'Priority support',
    ],
    cta: 'Start free trial',
  },
]

export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)' }}
    >
      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-[20px]"
        style={{
          backgroundColor: 'rgba(7, 9, 13, 0.8)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Shield
            size={22}
            style={{ color: 'var(--accent)' }}
            strokeWidth={2}
          />
          <span
            className="font-semibold text-base tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            FreightShield
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <SignInButton>
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton>
            <Button variant="primary" size="sm">
              Start free trial
            </Button>
          </SignUpButton>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-24 pb-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-6">
          <Badge variant="info" dot>
            Now in early access — 14-day free trial
          </Badge>
        </div>

        <h1
          className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
          style={{ color: 'var(--text-primary)' }}
        >
          Stop chameleon carriers{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            in 30 seconds
          </span>
          ,{' '}
          <br className="hidden md:block" />
          not 30 minutes.
        </h1>

        <p
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          The carrier compliance OS for U.S. freight brokerages. One-click FMCSA
          vetting, nightly monitoring, and automated onboarding — without the
          $340/mo RMIS subscription.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignUpButton>
            <Button variant="primary" size="lg" className="gap-2">
              Start your free trial
              <ArrowRight size={18} />
            </Button>
          </SignUpButton>
          <Button variant="ghost" size="lg" className="gap-2">
            <Zap size={18} style={{ color: 'var(--accent)' }} />
            See a live demo
          </Button>
        </div>

        <p
          className="mt-4 text-sm"
          style={{ color: 'var(--text-tertiary)' }}
        >
          No credit card required · 14-day free trial · Cancel anytime
        </p>
      </section>

      {/* ── Social proof strip ───────────────────────────────────────── */}
      <section
        className="py-8 px-6"
        style={{
          backgroundColor: 'var(--surface-1)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.value}>
              <div
                className="text-3xl font-bold tabular mb-1"
                style={{ color: 'var(--accent)' }}
              >
                {stat.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-3 tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Replace your spreadsheet in one afternoon
        </h2>
        <p
          className="text-center mb-12"
          style={{ color: 'var(--text-secondary)' }}
        >
          Most brokerages are fully set up within 2 hours.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <GlassCard key={step.step} className="p-6">
                <div
                  className="text-xs font-mono font-bold mb-4"
                  style={{ color: 'var(--accent)' }}
                >
                  {step.step}
                </div>
                <Icon
                  size={28}
                  className="mb-4"
                  style={{ color: 'var(--text-primary)' }}
                  strokeWidth={1.5}
                />
                <h3
                  className="font-semibold text-lg mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {step.description}
                </p>
              </GlassCard>
            )
          })}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-5xl mx-auto" id="pricing">
        <h2
          className="text-3xl font-bold text-center mb-3 tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Simple, transparent pricing
        </h2>
        <p
          className="text-center mb-12"
          style={{ color: 'var(--text-secondary)' }}
        >
          Half the cost of RMIS. Ten times the UX.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {tiers.map((tier) => (
            <GlassCard
              key={tier.name}
              glow={tier.highlight}
              className={`p-6 flex flex-col gap-6 ${tier.highlight ? 'md:-mt-2 md:-mb-2' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {tier.name}
                  </span>
                  {tier.badge && (
                    <Badge variant="info" dot>
                      {tier.badge}
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className="text-4xl font-bold tabular"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {tier.price}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>{tier.period}</span>
                </div>

                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {tier.description}
                </p>
              </div>

              <ul className="flex flex-col gap-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <SignUpButton>
                <Button
                  variant={tier.highlight ? 'primary' : 'secondary'}
                  size="md"
                  className="w-full"
                >
                  {tier.cta}
                </Button>
              </SignUpButton>
            </GlassCard>
          ))}
        </div>

        <p
          className="text-center mt-8 text-sm"
          style={{ color: 'var(--text-tertiary)' }}
        >
          All plans include a 14-day free trial. No credit card required to start.
          <br />
          <span className="text-xs mt-1 block">
            FreightShield provides decision support tools only and is not a substitute for independent legal or compliance review.
          </span>
        </p>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────── */}
      <section className="px-6 py-20 max-w-3xl mx-auto text-center">
        <GlassCard glow className="p-12">
          <Shield
            size={40}
            className="mx-auto mb-6"
            style={{ color: 'var(--accent)' }}
            strokeWidth={1.5}
          />
          <h2
            className="text-3xl font-bold mb-4 tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready to vet your first carrier?
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Join freight brokerages already using FreightShield to eliminate
            compliance blind spots.
          </p>
          <SignUpButton>
            <Button variant="primary" size="lg" className="gap-2">
              Start free trial — no card needed
              <ArrowRight size={18} />
            </Button>
          </SignUpButton>
        </GlassCard>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-10"
        style={{
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              FreightShield
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/pricing" className="hover:text-[var(--text-secondary)] transition-colors">
              Pricing
            </Link>
            <Link href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">
              Privacy
            </Link>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-disabled)' }}>
            © {new Date().getFullYear()} FreightShield. Decision support only — not legal advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
