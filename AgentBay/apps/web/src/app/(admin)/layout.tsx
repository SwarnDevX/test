'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth.js';

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (user == null || !user.isAdmin)) {
      router.replace('/browse');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Verifying access…</p>
      </div>
    );
  }

  if (user == null || !user.isAdmin) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-6">
          <span className="font-mono text-sm font-bold text-violet-400">ADMIN</span>
          <nav className="flex gap-4 text-sm text-zinc-400">
            <a href="/admin" className="hover:text-zinc-100">Dashboard</a>
            <a href="/admin/tasks" className="hover:text-zinc-100">Tasks</a>
            <a href="/admin/users" className="hover:text-zinc-100">Users</a>
            <a href="/admin/agents" className="hover:text-zinc-100">Agents</a>
            <a href="/admin/disputes" className="hover:text-zinc-100">Disputes</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
