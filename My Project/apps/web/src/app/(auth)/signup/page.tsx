"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useUIStore } from "@/stores/ui.store";
import { Providers } from "@/app/providers";

function SignupForm() {
  const router = useRouter();
  const setActiveWorkspaceId = useUIStore((s) => s.setActiveWorkspaceId);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: (data) => {
      const u = data.user as any;
      if (u?.workspaces?.[0]) {
        setActiveWorkspaceId(u.workspaces[0].id);
      }
      router.push("/dashboard");
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    signupMutation.mutate({ name, email, password });
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
          <h1 className="text-xl font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-fg-muted mb-6">
            Start building workflows for free. No credit card required.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-border/60 bg-bg-surface-2 text-sm placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium rounded-lg transition-all active:scale-[0.98]"
            >
              {signupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
            </button>
          </form>

          <p className="text-xs text-fg-muted text-center mt-4">
            By signing up you agree to our{" "}
            <a href="/terms" className="text-accent hover:underline">Terms</a> and{" "}
            <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>.
          </p>
        </div>

        <p className="text-center text-sm text-fg-muted mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Providers>
      <SignupForm />
    </Providers>
  );
}
