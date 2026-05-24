'use client'

import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Bell, Search } from 'lucide-react'

const titleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/carriers': 'Carriers',
  '/dashboard/alerts': 'Alerts',
  '/dashboard/onboarding': 'Onboarding',
  '/dashboard/reports': 'Reports',
  '/dashboard/settings': 'Settings',
  '/dashboard/lookup': 'Carrier Lookup',
}

function getTitle(pathname: string): string {
  // Exact match first
  if (titleMap[pathname]) return titleMap[pathname]
  // Prefix match for nested routes
  for (const [key, label] of Object.entries(titleMap)) {
    if (pathname.startsWith(key + '/')) return label
  }
  return 'FreightShield'
}

export function AppTopBar() {
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <header
      className="flex items-center justify-between px-6 h-14 flex-shrink-0"
      style={{
        backgroundColor: 'rgba(7, 9, 13, 0.7)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Page title */}
      <h1
        className="text-sm font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search hint — cmd+K (non-functional in Phase 1) */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors duration-150"
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-tertiary)',
          }}
          aria-label="Search (⌘K)"
        >
          <Search size={13} />
          <span>Search</span>
          <kbd
            className="px-1 rounded text-[10px] font-mono"
            style={{
              backgroundColor: 'var(--surface-3)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-disabled)',
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label="Notifications"
        >
          <Bell size={17} />
          {/* Red dot — unread indicator (placeholder) */}
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--critical)' }}
            aria-hidden
          />
        </button>

        {/* User avatar */}
        <UserButton
          appearance={{
            variables: {
              colorPrimary: 'var(--accent)',
              colorBackground: 'rgba(10, 13, 20, 0.95)',
              colorText: 'var(--text-primary)',
              colorTextSecondary: 'var(--text-secondary)',
              borderRadius: '10px',
            },
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </div>
    </header>
  )
}
