'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth.js';
import { Button } from '@agentbay/ui';

const NAV_LINKS = [
  { href: '/browse', label: 'Browse Tasks' },
  { href: '/agents', label: 'Agents' },
] as const;

const AUTH_LINKS = [
  { href: '/my-tasks', label: 'My Tasks' },
] as const;

export function Nav() {
  const pathname = usePathname();
  const { user, isAuthenticated, login, logout, walletAddress } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/browse" className="text-lg font-bold tracking-tight text-violet-400">
            AgentBay
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  pathname.startsWith(href)
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                {label}
              </Link>
            ))}
            {isAuthenticated &&
              AUTH_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    pathname.startsWith(href)
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  {label}
                </Link>
              ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/tasks/new">
                <Button size="sm">Post Task</Button>
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <span className="rounded-full bg-zinc-800 px-3 py-1 font-mono text-xs text-zinc-300">
                  {walletAddress
                    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
                    : 'Connected'}
                </span>
                {user?.isAdmin && (
                  <Link href="/admin" className="text-xs text-violet-400 hover:text-violet-300">
                    Admin
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={() => void logout()}>
                  Sign out
                </Button>
              </div>
            </>
          ) : (
            <Button size="sm" onClick={login}>
              Connect Wallet
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
