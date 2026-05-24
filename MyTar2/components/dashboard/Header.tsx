'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Bell, Zap } from 'lucide-react';

interface HeaderUser { id: string; email: string; name: string | null; credits: number; subscription: string; }

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/brand-kits': 'Brand Kits',
  '/settings': 'Settings',
};

export default function DashboardHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const title = titles[pathname] || 'Dashboard';

  return (
    <header style={{ height: 60, borderBottom: '1px solid #1e1e40', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: '#07071a', flexShrink: 0 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f0f0ff' }}>{title}</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Credits badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#111128', borderRadius: 100, border: '1px solid #1e1e40', fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
          <Zap size={13} />{user.credits} credits
        </div>

        {/* New Project */}
        <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
          <Plus size={14} /> New Project
        </Link>

        {/* Notifications */}
        <button style={{ width: 36, height: 36, borderRadius: 10, background: '#111128', border: '1px solid #1e1e40', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', position: 'relative' }}>
          <Bell size={16} />
          <div style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, background: '#ef4444', borderRadius: '50%', border: '1.5px solid #07071a' }} />
        </button>

        {/* Avatar */}
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
          {(user.name || user.email)[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
}
