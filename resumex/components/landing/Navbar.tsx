"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FileText, Zap } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/[0.06]"
    >
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
          <FileText className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg text-white tracking-tight">
          Resume<span className="gradient-text">X</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
        <Link href="#templates" className="hover:text-white transition-colors">Templates</Link>
        <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
      </div>

      <div className="flex items-center gap-3">
        {session ? (
          <Link href="/dashboard" className="btn-primary">
            <Zap className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/register" className="btn-primary text-sm">
              Get started free
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
}
