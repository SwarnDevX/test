"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Providers } from "@/app/providers";

function ResetForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const resetMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    resetMutation.mutate({ email });
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">FlowForge</span>
        </div>

        <div className="p-6 rounded-xl border border-border/60 bg-bg-surface-1">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h2 className="font-semibold mb-2">Check your email</h2>
              <p className="text-sm text-fg-muted">
                We sent a password reset link to <span className="text-fg">{email}</span>.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold mb-1">Reset password</h1>
              <p className="text-sm text-fg-muted mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
                {error && (
                  <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium rounded-lg transition-all"
                >
                  {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-fg-muted mt-4">
          <Link href="/login" className="text-accent hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Providers>
      <ResetForm />
    </Providers>
  );
}
