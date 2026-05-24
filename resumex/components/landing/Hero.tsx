"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Code2, Download } from "lucide-react";

const STEPS = [
  { icon: Sparkles, label: "Pick a template" },
  { icon: Code2, label: "Edit visually" },
  { icon: Download, label: "Download PDF" },
];

export function Hero() {
  return (
    <section className="relative pt-36 pb-24 px-6 flex flex-col items-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-indigo-300 mb-6"
        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
      >
        <Sparkles className="w-3 h-3" />
        No LaTeX knowledge required
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight max-w-4xl"
      >
        Build your{" "}
        <span className="gradient-text">LaTeX resume</span>
        <br />
        without the code
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-lg text-slate-400 max-w-2xl leading-relaxed"
      >
        ResumeX gives you a beautiful visual editor for LaTeX resumes. Pick from profession-specific
        templates, customize every section, and download a pixel-perfect PDF — no Overleaf needed.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10 flex items-center gap-4 flex-wrap justify-center"
      >
        <Link href="/register" className="btn-primary text-base px-7 py-3.5">
          Start building for free
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="#templates" className="btn-ghost text-base px-7 py-3.5">
          Browse templates
        </Link>
      </motion.div>

      {/* Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-16 flex items-center gap-3 flex-wrap justify-center"
      >
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-slate-300">
              <step.icon className="w-4 h-4 text-indigo-400" />
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            )}
          </div>
        ))}
      </motion.div>

      {/* Editor preview mockup */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="relative mt-20 w-full max-w-5xl mx-auto"
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6), 0 0 80px -20px rgba(99,102,241,0.15)",
          }}
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <div className="flex-1 mx-4 h-5 rounded-md" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
          {/* Editor body */}
          <div className="grid grid-cols-12 min-h-[380px]">
            {/* Sidebar */}
            <div className="col-span-3 border-r border-white/[0.06] p-4 space-y-2">
              {["Personal Info", "Experience", "Education", "Skills", "Projects"].map((s, i) => (
                <div
                  key={s}
                  className="px-3 py-2 rounded-lg text-xs text-slate-400"
                  style={{
                    background: i === 1 ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                    color: i === 1 ? "#a5b4fc" : undefined,
                    border: i === 1 ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
            {/* Form editor */}
            <div className="col-span-5 p-5 border-r border-white/[0.06] space-y-4">
              <div className="space-y-1">
                <div className="h-2.5 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="h-8 w-full rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div className="space-y-1">
                <div className="h-2.5 w-28 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="h-8 w-full rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 w-24 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-2">
                    <div className="h-7 w-7 rounded-md flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }} />
                    <div className="h-7 flex-1 rounded-md" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
                  </div>
                ))}
              </div>
            </div>
            {/* PDF preview */}
            <div className="col-span-4 p-5 flex flex-col gap-2.5">
              {[80, 60, 100, 60, 80, 60, 90, 50].map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: i === 0 ? "14px" : "8px",
                    width: `${w}%`,
                    background: i === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Glow */}
        <div
          className="absolute inset-0 -z-10 rounded-2xl blur-3xl opacity-20"
          style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
        />
      </motion.div>
    </section>
  );
}
