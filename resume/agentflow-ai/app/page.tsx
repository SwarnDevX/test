'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Zap, GitBranch, Brain, Shield, Sparkles, Activity, Database } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Multi-Agent Orchestration',
    desc: 'Planner → Executor → Validator pipeline with structured JSON communication and confidence scoring.',
    color: 'violet',
  },
  {
    icon: GitBranch,
    title: 'Visual Workflow Builder',
    desc: 'Drag-and-drop nodes (LLM, API, DB, Condition) into streaming execution pipelines.',
    color: 'cyan',
  },
  {
    icon: Database,
    title: 'RAG Knowledge Base',
    desc: 'Upload PDFs/CSV/TXT, auto-chunk, embed, and retrieve with semantic vector search.',
    color: 'emerald',
  },
  {
    icon: Activity,
    title: 'Full Observability',
    desc: 'Real-time token usage, latency, cost tracking, and agent step transparency.',
    color: 'amber',
  },
  {
    icon: Sparkles,
    title: 'Pluggable Tool Registry',
    desc: 'Search KB, calculate, query DB, call APIs, generate text — all dynamically invoked.',
    color: 'violet',
  },
  {
    icon: Shield,
    title: 'Production Architecture',
    desc: 'Prisma + SQLite/PostgreSQL, Redis memory, Socket.IO streaming, Zod validation.',
    color: 'cyan',
  },
]

const agentSteps = [
  { label: 'Planner Agent', sub: 'Structured JSON plan', color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20', icon: '🧠', badge: 'bg-violet-500/15 text-violet-400' },
  { label: 'Executor Agent', sub: 'Tool calling + RAG', color: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/20', icon: '⚡', badge: 'bg-cyan-500/15 text-cyan-400' },
  { label: 'Validator Agent', sub: 'Confidence scoring', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20', icon: '✅', badge: 'bg-emerald-500/15 text-emerald-400' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight">AgentFlow<span className="text-gradient"> AI</span></span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <div className="pulse-dot w-1.5 h-1.5" />
              Live
            </div>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2 btn-neon text-white text-sm font-medium rounded-xl"
            >
              Launch App <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-36 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-700/10 rounded-full blur-[160px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/6 rounded-full blur-[140px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 glass px-4 py-1.5 mb-8 rounded-full"
        >
          <div className="pulse-dot w-1.5 h-1.5" />
          <span className="text-xs font-medium text-white/60">Production-grade AI System</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] max-w-5xl"
        >
          Autonomous AI
          <br />
          <span className="text-gradient">Workflow Engine</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-lg text-white/45 max-w-2xl leading-relaxed"
        >
          Multi-agent orchestration with RAG-powered knowledge retrieval, pluggable tools,
          visual workflow builder, and full real-time observability.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/chat" className="flex items-center gap-2 px-8 py-3.5 btn-neon text-white font-semibold rounded-2xl text-sm">
            Start Building <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/workflows" className="flex items-center gap-2 px-8 py-3.5 glass hover:bg-white/[0.07] text-white/80 font-semibold rounded-2xl text-sm transition-all">
            View Workflows
          </Link>
        </motion.div>

        {/* Architecture preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-20 w-full max-w-4xl"
        >
          <div className="gradient-border p-0.5 rounded-2xl">
            <div className="bg-[#08071a] rounded-[18px] p-6">
              {/* Window chrome */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                <span className="ml-4 text-[11px] text-white/25 font-mono">agentflow — chat</span>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <div className="pulse-dot w-1.5 h-1.5" />LIVE
                </div>
              </div>

              <div className="flex gap-6">
                {/* Agent pipeline */}
                <div className="flex-1 space-y-3">
                  {agentSteps.map((step, i) => (
                    <div key={step.label}>
                      <div className={`glass p-3.5 flex items-center gap-3 border ${step.border} bg-gradient-to-r ${step.color}`}>
                        <span className="text-xl">{step.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{step.label}</div>
                          <div className="text-[11px] text-white/40">{step.sub}</div>
                        </div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 + i * 0.4 }}
                          className={`badge ${step.badge}`}
                        >
                          ✓ done
                        </motion.div>
                      </div>
                      {i < agentSteps.length - 1 && (
                        <div className="flex justify-center my-1">
                          <div className="w-px h-4 bg-gradient-to-b from-white/20 to-transparent" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-px bg-white/[0.05]" />

                {/* Live trace */}
                <div className="w-52 space-y-3 font-mono">
                  <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Live Trace</div>
                  <div className="space-y-2 text-[11px]">
                    {[
                      { text: '✓ Plan created (3 steps)', c: 'text-emerald-400' },
                      { text: '✓ RAG: 4 chunks retrieved', c: 'text-cyan-400' },
                      { text: '✓ Tools: search_kb called', c: 'text-amber-400' },
                      { text: '○ Validation in progress...', c: 'text-white/30' },
                    ].map((l, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + i * 0.3 }}
                        className={l.c}
                      >
                        {l.text}
                      </motion.div>
                    ))}
                  </div>
                  <div className="pt-3 border-t border-white/[0.05]">
                    <div className="text-[10px] text-white/30 mb-1.5">Confidence</div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '87%' }}
                        transition={{ delay: 2, duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3 }}
                      className="text-sm font-bold text-white mt-1.5"
                    >
                      87% confident
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white">Production-grade AI Infrastructure</h2>
          <p className="text-sm text-white/40 mt-2">Every component built for real-world reliability</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="glass-card p-5 group"
            >
              <div className={`w-10 h-10 rounded-xl bg-${f.color}-500/10 border border-${f.color}-500/20 flex items-center justify-center mb-4 group-hover:bg-${f.color}-500/20 transition-colors`}>
                <f.icon className={`w-5 h-5 text-${f.color}-400`} />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center pb-24 px-6">
        <div className="inline-block">
          <div className="gradient-border p-8 max-w-lg mx-auto">
            <div className="text-xl font-bold text-white mb-2">Ready to build?</div>
            <p className="text-sm text-white/40 mb-6">Add your OpenAI API key and start building autonomous workflows in minutes.</p>
            <Link href="/chat" className="inline-flex items-center gap-2 px-8 py-3 btn-neon text-white font-semibold rounded-xl text-sm">
              Open AgentFlow AI <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
