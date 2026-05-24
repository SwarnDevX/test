'use client';
import Link from 'next/link';
import { Plus, Zap, FolderOpen, Palette, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Project { id: string; name: string; formatName: string; thumbnail: string | null; updatedAt: string; }
interface Props {
  user: { name: string | null; email: string; credits: number; subscription: string; };
  projects: Project[];
  brandKitCount: number;
}

export default function DashboardContent({ user, projects, brandKitCount }: Props) {
  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderOpen, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Credits Left', value: user.credits, icon: Zap, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Brand Kits', value: brandKitCount, icon: Palette, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Plan', value: user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1), icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 4 }}>
          Welcome back, {user.name?.split(' ')[0] || 'Creator'} 👋
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15 }}>Let&apos;s create something amazing today.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background: '#111128', borderRadius: 16, border: '1px solid #1e1e40', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <Link href="/projects" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.08))', borderRadius: 14, border: '1px solid rgba(139,92,246,0.25)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={22} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f0ff' }}>New Project</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Start a fresh ad design</div>
              </div>
              <ArrowRight size={16} color="#8b5cf6" style={{ marginLeft: 'auto' }} />
            </div>
          </Link>
          <Link href="/brand-kits" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: '#111128', borderRadius: 14, border: '1px solid #1e1e40', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e40'; }}>
              <div style={{ width: 44, height: 44, background: 'rgba(59,130,246,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Palette size={22} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f0ff' }}>Brand Kits</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Manage your brand assets</div>
              </div>
              <ArrowRight size={16} color="#3b82f6" style={{ marginLeft: 'auto' }} />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Recent Projects</h2>
          <Link href="/projects" style={{ fontSize: 13, color: '#8b5cf6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div style={{ background: '#111128', borderRadius: 16, border: '1px dashed #2a2a55', padding: '48px 24px', textAlign: 'center' }}>
            <FolderOpen size={40} color="#2a2a55" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#475569', fontSize: 15, marginBottom: 20 }}>No projects yet. Create your first ad!</p>
            <Link href="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              <Plus size={16} /> Create First Project
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {projects.map(p => (
              <Link key={p.id} href={`/editor/${p.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: '#111128', borderRadius: 14, border: '1px solid #1e1e40', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e40'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ height: 130, background: 'linear-gradient(135deg, #1a1a3e, #0d0d24)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1e1e40', position: 'relative' }}>
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: 12, opacity: 0.4 }} />
                    )}
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: '#0d0d24', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#94a3b8', border: '1px solid #1e1e40' }}>{p.formatName}</div>
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#f0f0ff' }}>{p.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569' }}>
                      <Clock size={11} /> {formatRelativeTime(p.updatedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
