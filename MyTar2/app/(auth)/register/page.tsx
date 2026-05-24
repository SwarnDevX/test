'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ArrowRight, Check } from 'lucide-react';

const perks = ['10 free credits', 'All ad formats', 'Full layer editor', 'No credit card required'];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        return;
      }
      toast.success('Account created! Welcome to AdCreativeAI 🎉');
      // Hard navigate so the browser sends the fresh httpOnly cookie to middleware
      window.location.href = '/dashboard';
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: '#111128', borderRadius: 20, border: '1px solid #1e1e40', padding: 36, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em' }}>Create your account</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 16 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {perks.map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 100, border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, color: '#10b981' }}>
            <Check size={11} />{p}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Full Name</label>
          <input
            type="text" required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Alex Johnson"
            style={{ width: '100%', padding: '11px 14px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 10, color: '#f0f0ff', fontSize: 14, outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
            onBlur={e => (e.target.style.borderColor = '#1e1e40')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Email</label>
          <input
            type="email" required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
            style={{ width: '100%', padding: '11px 14px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 10, color: '#f0f0ff', fontSize: 14, outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
            onBlur={e => (e.target.style.borderColor = '#1e1e40')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'} required minLength={8}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Min. 8 characters"
              style={{ width: '100%', padding: '11px 44px 11px 14px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 10, color: '#f0f0ff', fontSize: 14, outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
              onBlur={e => (e.target.style.borderColor = '#1e1e40')}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 10, background: loading ? '#2a2a55' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6, boxShadow: loading ? 'none' : '0 0 20px rgba(139,92,246,0.35)' }}>
          {loading
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</>
            : <><span>Create Account</span><ArrowRight size={16} /></>}
        </button>
      </form>

      <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        By creating an account you agree to our{' '}
        <span style={{ color: '#94a3b8' }}>Terms of Service</span> and{' '}
        <span style={{ color: '#94a3b8' }}>Privacy Policy</span>.
      </p>
    </div>
  );
}
