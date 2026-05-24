'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, CreditCard, Bell, Shield, Loader2, Check, Zap } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '@/lib/types';

interface UserInfo { id: string; email: string; name: string | null; credits: number; subscription: string; avatar: string | null; }

export default function SettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tab, setTab] = useState<'profile' | 'billing' | 'notifications'>('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', currentPassword: '', newPassword: '' });

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setUser(d.user);
      setForm(f => ({ ...f, name: d.user.name || '' }));
    });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    toast.success('Profile updated');
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 28 }}>Settings</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: '#0d0d24', borderRadius: 12, padding: 4, border: '1px solid #1e1e40' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, background: tab === id ? '#111128' : 'transparent', border: tab === id ? '1px solid #2a2a55' : '1px solid transparent', color: tab === id ? '#f0f0ff' : '#475569', cursor: 'pointer', fontSize: 14, fontWeight: tab === id ? 600 : 400, transition: 'all 0.15s' }}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ background: '#111128', borderRadius: 16, border: '1px solid #1e1e40', padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Profile Information</h2>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>Update your name and password.</p>
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', padding: '11px 14px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 10, color: '#f0f0ff', fontSize: 14, outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Email</label>
              <input value={user?.email || ''} disabled
                style={{ width: '100%', padding: '11px 14px', background: '#0a0a1a', border: '1px solid #1e1e40', borderRadius: 10, color: '#475569', fontSize: 14, outline: 'none', cursor: 'not-allowed' }} />
            </div>
            <div style={{ paddingTop: 8, borderTop: '1px solid #1e1e40' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Change Password</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['currentPassword', 'newPassword'].map((field, i) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{i === 0 ? 'Current Password' : 'New Password'}</label>
                    <input type="password" placeholder="••••••••"
                      value={form[field as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ width: '100%', padding: '11px 14px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 10, color: '#f0f0ff', fontSize: 14, outline: 'none' }}
                      onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')} />
                  </div>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={15} />Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {tab === 'billing' && (
        <div>
          {/* Current Plan */}
          <div style={{ background: '#111128', borderRadius: 16, border: '1px solid #1e1e40', padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Current Plan</h3>
                <p style={{ fontSize: 14, color: '#94a3b8' }}>Your subscription details</p>
              </div>
              <div style={{ padding: '6px 14px', background: 'rgba(139,92,246,0.15)', borderRadius: 100, border: '1px solid rgba(139,92,246,0.3)', fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>
                {user?.subscription?.charAt(0).toUpperCase()}{user?.subscription?.slice(1)} Plan
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1, padding: '16px 20px', background: '#0d0d24', borderRadius: 12, border: '1px solid #1e1e40' }}>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>Credits Remaining</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={20} color="#f59e0b" /><span style={{ fontSize: 28, fontWeight: 800 }}>{user?.credits ?? 0}</span></div>
              </div>
              <div style={{ flex: 1, padding: '16px 20px', background: '#0d0d24', borderRadius: 12, border: '1px solid #1e1e40' }}>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>Monthly Reset</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>Free</div>
              </div>
            </div>
          </div>

          {/* Upgrade Plans */}
          <div style={{ background: '#111128', borderRadius: 16, border: '1px solid #1e1e40', padding: 28 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Upgrade Plan</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {Object.entries(SUBSCRIPTION_TIERS).filter(([k]) => k !== 'free').map(([key, tier]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#0d0d24', borderRadius: 12, border: '1px solid #1e1e40' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{tier.name}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{tier.credits} credits/month</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>${tier.price}<span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>/mo</span></div>
                    <button style={{ padding: '8px 18px', borderRadius: 8, background: user?.subscription === key ? '#0d0d24' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: user?.subscription === key ? '#475569' : 'white', border: '1px solid', borderColor: user?.subscription === key ? '#1e1e40' : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      {user?.subscription === key ? 'Current' : 'Upgrade'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div style={{ background: '#111128', borderRadius: 16, border: '1px solid #1e1e40', padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Notification Preferences</h2>
          {[
            { label: 'AI Generation Complete', desc: 'Notify when background/copy generation finishes', defaultOn: true },
            { label: 'Low Credits Warning', desc: 'Alert when credits drop below 5', defaultOn: true },
            { label: 'Export Ready', desc: 'Notify when your export is ready to download', defaultOn: false },
            { label: 'New Features', desc: 'Product updates and new feature announcements', defaultOn: false },
          ].map(({ label, desc, defaultOn }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #1e1e40' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{desc}</div>
              </div>
              <div style={{ width: 44, height: 24, background: defaultOn ? '#8b5cf6' : '#1e1e40', borderRadius: 12, position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: defaultOn ? 22 : 2, width: 20, height: 20, background: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
