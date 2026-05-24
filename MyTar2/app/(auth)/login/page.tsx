'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }
      toast.success('Welcome back!');
      // Hard navigate so the browser sends the fresh httpOnly cookie to middleware
      window.location.href = '/dashboard';
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setForm({ email: 'demo@adcreative.ai', password: 'demo1234' });
  }

  return (
    <div style={{ background: '#111128', borderRadius: 20, border: '1px solid #1e1e40', padding: 36, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, letterSpacing: '-0.02em' }}>Welcome back</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28 }}>
        Don&apos;t have an account?{' '}
        <Link href="/register" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Sign up free</Link>
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: 13, color: '#a78bfa', textDecoration: 'none' }}>Forgot password?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'} required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
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
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 10, background: loading ? '#2a2a55' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, boxShadow: loading ? 'none' : '0 0 20px rgba(139,92,246,0.35)', transition: 'all 0.2s' }}>
          {loading
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</>
            : <><span>Sign In</span><ArrowRight size={16} /></>}
        </button>
      </form>

      {/* Demo credentials — click to fill */}
      <button
        onClick={fillDemo}
        style={{ marginTop: 20, width: '100%', padding: '12px 14px', background: '#0d0d24', borderRadius: 10, border: '1px solid #1e1e40', cursor: 'pointer', textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: '#475569', marginBottom: 3, margin: 0 }}>Click to fill demo credentials</p>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, marginTop: 4 }}>demo@adcreative.ai / demo1234</p>
      </button>
    </div>
  );
}
