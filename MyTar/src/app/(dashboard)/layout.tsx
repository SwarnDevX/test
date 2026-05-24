'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Sparkles, LayoutDashboard, Palette, CreditCard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Projects' },
  { href: '/brand-kits', icon: Palette, label: 'Brand Kits' },
  { href: '/billing', icon: CreditCard, label: 'Billing' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const credits = (session?.user as any)?.creditBalance ?? 0;
  const plan = (session?.user as any)?.plan ?? 'FREE';

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-slate-900 border-r border-white/10 flex flex-col transform transition-transform',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <Sparkles className="h-5 w-5 text-blue-400" />
          <span className="font-bold text-sm">AdCreative AI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                pathname === href
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Credits */}
        <div className="mx-3 mb-3 p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400">Credits</span>
            <span className="text-xs bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-full">{plan}</span>
          </div>
          <div className="text-2xl font-bold text-white">{credits}</div>
          <Link href="/billing" className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block">
            Get more →
          </Link>
        </div>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{session?.user?.name ?? 'User'}</div>
              <div className="text-xs text-slate-400 truncate">{session?.user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen overflow-auto">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-slate-900 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 font-bold text-sm">
            <Sparkles className="h-4 w-4 text-blue-400" />
            AdCreative AI
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

