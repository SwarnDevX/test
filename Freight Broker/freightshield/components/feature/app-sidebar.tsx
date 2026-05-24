'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OrganizationSwitcher } from '@clerk/nextjs'
import {
  Shield,
  LayoutDashboard,
  Truck,
  Bell,
  ClipboardCheck,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/carriers', label: 'Carriers', icon: Truck },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/onboarding', label: 'Onboarding', icon: ClipboardCheck },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col h-full w-60 flex-shrink-0"
      style={{
        backgroundColor: 'rgba(7, 9, 13, 0.8)',
        borderRight: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 h-14 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <Shield
          size={20}
          style={{ color: 'var(--accent)' }}
          strokeWidth={2}
        />
        <span
          className="font-semibold text-sm tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          FreightShield
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    'transition-colors duration-150',
                    isActive
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: 'var(--surface-2)',
                          color: 'var(--text-primary)',
                        }
                      : undefined
                  }
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2 : 1.5}
                    style={{ color: isActive ? 'var(--accent)' : 'currentColor' }}
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Org switcher */}
      <div
        className="px-3 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <OrganizationSwitcher
          hidePersonal
          appearance={{
            variables: {
              colorBackground: 'rgba(255,255,255,0.05)',
              colorText: 'var(--text-primary)',
              colorTextSecondary: 'var(--text-secondary)',
              colorPrimary: 'var(--accent)',
              colorInputBackground: 'rgba(255,255,255,0.05)',
              colorInputText: 'var(--text-primary)',
              borderRadius: '10px',
            },
            elements: {
              rootBox: 'w-full',
              organizationSwitcherTrigger:
                'w-full px-3 py-2 rounded-lg text-sm hover:bg-[var(--surface-2)] transition-colors',
              organizationSwitcherTriggerIcon: 'text-[var(--text-tertiary)]',
            },
          }}
        />
      </div>
    </aside>
  )
}
