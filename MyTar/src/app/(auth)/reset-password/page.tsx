'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
    setLoading(false);
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/login?reset=1');
    } else {
      setError(data.error || 'Reset failed. The link may have expired.');
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md px-8 py-10 bg-white/5 border border-white/10 rounded-2xl backdrop-blur">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 text-white text-xl font-bold">
          <Sparkles className="h-5 w-5 text-blue-400" />
          AdCreative AI
        </div>
        <h1 className="text-2xl font-bold text-white mt-4">
          {token ? 'Set new password' : 'Reset password'}
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {token ? 'Enter your new password below' : "We'll send you a reset link"}
        </p>
      </div>

      {submitted && !token ? (
        <div className="text-center">
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm mb-6">
            Check your email for a password reset link.
          </div>
          <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </div>
      ) : token ? (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 pr-10"
                placeholder="Min. 6 characters"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2.5 rounded-lg">{error}</div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">
            {loading ? 'Saving...' : 'Set New Password'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
          <div className="text-center">
            <Link href="/login" className="text-slate-400 hover:text-slate-300 text-sm flex items-center justify-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950">
      <Suspense fallback={<div className="text-white text-sm">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
