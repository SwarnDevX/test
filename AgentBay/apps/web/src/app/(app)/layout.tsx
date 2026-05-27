'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '../../components/nav.js';
import { useAuth } from '../../lib/auth.js';

export default function AppLayout({ children }: { readonly children: React.ReactNode }) {
  const { isReady, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/browse');
    }
  }, [isReady, isAuthenticated, router]);

  if (!isReady) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-900" />
            ))}
          </div>
        </main>
      </>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </>
  );
}
