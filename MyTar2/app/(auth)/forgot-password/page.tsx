'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
    toast.success('Reset link sent (demo mode)');
  }

  if (sent) {
    return (
      <div style={{ background: '#111128', borderRadius: 20, border: '1px solid #1e1e40', padding: 36, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={28} color="#10b981" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Check your email</h2>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28, lineHeight: 1.6 }}>
          We sent a reset link to <strong style={{ color: '#f0f0ff' }}>{email}</strong>.<br />
          It expires in 15 minutes.
        </p>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: '1px solid #2a2a55', color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#111128', borderRadius: 20, border: '1px solid #1e1e40', padding: 36 }}>
      <div style={{ width: 48, height: 48, background: 'rgba(139,92,246,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Mail size={24} color="#8b5cf6" />
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Reset your password</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28 }}>Enter your email and we&apos;ll send you a link to reset your password.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Email</label>
          <input
            type="email" required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', padding: '11px 14px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 10, color: '#f0f0ff', fontSize: 14, outline: 'none' }}
            onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
            onBlur={e => (e.target.style.borderColor = '#1e1e40')}
          />
        </div>
        <button
          type="submit" disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset Link'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#94a3b8', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </div>
  );
}
