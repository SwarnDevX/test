'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Zap, LayoutDashboard, FolderOpen, Palette, Settings, LogOut, CreditCard, ChevronRight } from 'lucide-react';

interface SidebarUser { id: string; email: string; name: string | null; credits: number; subscription: string; }

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/brand-kits', label: 'Brand Kits', icon: Palette },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/login');
    router.refresh();
  }

  const planColor = { free: '#94a3b8', starter: '#10b981', pro: '#8b5cf6', business: '#f59e0b' }[user.subscription] ?? '#94a3b8';

  return (
    <aside style={{ width: 240, background: '#0d0d24', borderRight: '1px solid #1e1e40', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1e1e40' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={17} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#f0f0ff', letterSpacing: '-0.02em' }}>
            AdCreative<span style={{ color: '#8b5cf6' }}>AI</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 2, background: active ? 'rgba(139,92,246,0.12)' : 'transparent', border: `1px solid ${active ? 'rgba(139,92,246,0.25)' : 'transparent'}`, color: active ? '#a78bfa' : '#94a3b8', transition: 'all 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f0f0ff'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}>
                <Icon size={17} />
                <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>{label}</span>
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Credits */}
      <div style={{ padding: '12px 14px', margin: '0 10px 10px', background: '#111128', borderRadius: 12, border: '1px solid #1e1e40' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            <Zap size={13} color="#f59e0b" /> Credits
          </div>
          <span style={{ padding: '2px 8px', background: `${planColor}20`, borderRadius: 100, fontSize: 11, fontWeight: 700, color: planColor, border: `1px solid ${planColor}40` }}>
            {user.subscription}
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{user.credits}</div>
        <div style={{ height: 4, background: '#1e1e40', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', borderRadius: 2, width: `${Math.min(100, (user.credits / 100) * 100)}%` }} />
        </div>
        <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b5cf6', textDecoration: 'none', marginTop: 10, fontWeight: 600 }}>
          <CreditCard size={12} /> Upgrade Plan
        </Link>
      </div>

      {/* User + Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #1e1e40' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'User'}</div>
            <div style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
        </div>
        <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'transparent', border: '1px solid transparent', color: '#ef4444', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
