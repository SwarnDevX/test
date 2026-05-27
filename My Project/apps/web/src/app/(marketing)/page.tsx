"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, GitBranch, Brain, Shield, Code2, BarChart3,
  ArrowRight, Play, Github, Twitter, Star, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const spring = { ease: [0.32, 0.72, 0, 1] as const, duration: 0.5 };

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Native Nodes",
    description: "ChatGPT, Claude, Gemini, and 10+ LLM providers. Streaming, structured output, RAG pipelines — built in.",
    color: "oklch(65% 0.18 240)",
  },
  {
    icon: GitBranch,
    title: "Visual DAG Editor",
    description: "Drag-and-drop canvas with parallel branch execution. 500+ nodes at 60fps. Undo/redo, versioning, live collaboration.",
    color: "oklch(72% 0.17 145)",
  },
  {
    icon: Code2,
    title: "Sandboxed Code",
    description: "Run JavaScript and Python inside isolated VMs. No escape, no network, 256MB memory limit. Real stdlib, real packages.",
    color: "oklch(80% 0.18 85)",
  },
  {
    icon: Zap,
    title: "60+ Integrations",
    description: "Slack, GitHub, Stripe, HubSpot, Notion, Airtable, SendGrid, and dozens more — all with typed inputs, real executors.",
    color: "oklch(62% 0.22 25)",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Envelope-encrypted credentials, RBAC, 2FA/TOTP, audit logs, SOC 2 ready. Secrets never touch logs or the client.",
    color: "oklch(65% 0.18 300)",
  },
  {
    icon: BarChart3,
    title: "Execution Analytics",
    description: "Per-node timing, token usage, cost tracking by model. Real-time streaming via Socket.IO. Replay any run.",
    color: "oklch(70% 0.15 200)",
  },
] as const;

const TEMPLATES = [
  { name: "Lead-gen Chatbot", nodes: 7, runs: "12.4k" },
  { name: "RAG over PDFs", nodes: 5, runs: "8.9k" },
  { name: "GitHub Issue Triager", nodes: 9, runs: "6.2k" },
  { name: "Shopify → CRM Sync", nodes: 6, runs: "5.1k" },
  { name: "Email Classifier", nodes: 4, runs: "4.7k" },
  { name: "Daily News Digest", nodes: 8, runs: "3.8k" },
] as const;

const PRICING = [
  {
    name: "Free",
    price: 0,
    description: "For individuals and experiments",
    features: ["1,000 executions/mo", "5 workflows", "Community integrations", "1 workspace member"],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 29,
    description: "For professionals and small teams",
    features: ["50,000 executions/mo", "Unlimited workflows", "All integrations", "5 workspace members", "Priority support", "Custom domains"],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: 99,
    description: "For scaling teams",
    features: ["500,000 executions/mo", "Unlimited workflows", "All integrations", "Unlimited members", "SSO/SCIM", "Audit logs", "SLA"],
    cta: "Contact sales",
    highlighted: false,
  },
] as const;

function HeroCanvas() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="oklch(96% 0.005 260 / 0.5)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
      {/* Animated workflow nodes preview */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[600px] h-[300px]">
          {[
            { x: 60, y: 130, label: "Webhook", color: "oklch(72% 0.17 145)", delay: 0 },
            { x: 200, y: 80, label: "Filter", color: "oklch(80% 0.18 85)", delay: 0.1 },
            { x: 200, y: 180, label: "Parse JSON", color: "oklch(65% 0.18 240)", delay: 0.15 },
            { x: 360, y: 130, label: "GPT-4o", color: "oklch(65% 0.18 240)", delay: 0.2 },
            { x: 500, y: 130, label: "Slack", color: "oklch(72% 0.15 210)", delay: 0.3 },
          ].map((node) => (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: node.delay }}
              className="absolute"
              style={{ left: node.x, top: node.y }}
            >
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/90 shadow-lg border border-white/10"
                style={{ background: `${node.color}` }}
              >
                {node.label}
              </div>
            </motion.div>
          ))}
          {/* Animated edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            {[
              { d: "M 100 140 C 150 140, 160 90, 200 90", delay: 0.4 },
              { d: "M 100 140 C 150 140, 160 190, 200 190", delay: 0.45 },
              { d: "M 260 90 C 310 90, 320 140, 360 140", delay: 0.5 },
              { d: "M 260 190 C 310 190, 320 140, 360 140", delay: 0.55 },
              { d: "M 420 140 L 500 140", delay: 0.6 },
            ].map((edge, i) => (
              <motion.path
                key={i}
                d={edge.d}
                fill="none"
                stroke="oklch(65% 0.18 240 / 0.6)"
                strokeWidth="1.5"
                strokeDasharray="6 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ ...spring, delay: edge.delay }}
              />
            ))}
          </svg>
        </div>
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-bg-base text-fg overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-bg-base/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm">FlowForge</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-fg-muted">
            <a href="#features" className="hover:text-fg transition-colors">Features</a>
            <a href="#templates" className="hover:text-fg transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-fg transition-colors">Pricing</a>
            <a href="https://docs.flowforge.dev" className="hover:text-fg transition-colors">Docs</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 text-sm text-fg-muted hover:text-fg transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-md transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-14 px-4">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <HeroCanvas />
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-border/60 bg-bg-surface-2 text-xs text-fg-muted"
          >
            <Star className="w-3 h-3 text-warning" />
            <span>Open-source workflow automation — star us on GitHub</span>
            <ChevronRight className="w-3 h-3" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.05 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-balance"
          >
            Build AI workflows{" "}
            <span className="gradient-accent">without limits</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.1 }}
            className="text-lg md:text-xl text-fg-muted max-w-2xl mx-auto mb-8 text-balance"
          >
            Visual DAG editor. 60+ integrations. Multi-LLM AI nodes. Sandboxed code execution.
            Deploy in minutes, scale to millions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-all active:scale-[0.97] shadow-glow"
            >
              <Play className="w-4 h-4" />
              Start building free
            </Link>
            <a
              href="https://github.com/flowforge/flowforge"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-border/60 hover:border-border text-fg-muted hover:text-fg rounded-lg transition-all"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...spring, delay: 0.3 }}
            className="mt-4 text-xs text-fg-muted"
          >
            No credit card required · 1,000 executions/month free · Deploy in 2 minutes
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need</h2>
            <p className="text-fg-muted text-lg max-w-xl mx-auto">
              From simple automations to complex multi-agent pipelines — FlowForge handles it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ ...spring, delay: i * 0.05 }}
                className="p-6 rounded-xl border border-border/60 bg-bg-surface-1 hover:bg-bg-surface-2 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ background: `${feature.color}20`, border: `1px solid ${feature.color}30` }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-fg-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section id="templates" className="py-24 px-4 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Start with a template</h2>
              <p className="text-fg-muted">Pre-built workflows you can clone and customize.</p>
            </div>
            <Link href="/templates" className="text-sm text-accent hover:underline inline-flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...spring, delay: i * 0.05 }}
                className="p-5 rounded-xl border border-border/60 bg-bg-surface-1 hover:bg-bg-surface-2 hover:border-accent/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-sm">{t.name}</h3>
                  <ArrowRight className="w-4 h-4 text-fg-muted group-hover:text-accent transition-colors" />
                </div>
                <div className="flex items-center gap-3 text-xs text-fg-muted">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {t.nodes} nodes
                  </span>
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {t.runs} runs
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple pricing</h2>
            <p className="text-fg-muted text-lg">Start free, scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...spring, delay: i * 0.08 }}
                className={cn(
                  "p-6 rounded-xl border transition-all",
                  plan.highlighted
                    ? "border-accent bg-bg-surface-2 shadow-glow"
                    : "border-border/60 bg-bg-surface-1",
                )}
              >
                {plan.highlighted && (
                  <div className="text-xs font-medium text-accent mb-3">Most popular</div>
                )}
                <div className="mb-1 font-semibold text-lg">{plan.name}</div>
                <div className="mb-3 text-sm text-fg-muted">{plan.description}</div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-fg-muted text-sm">/mo</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-fg-muted flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price === 0 ? "/signup" : "/signup?plan=" + plan.name.toLowerCase()}
                  className={cn(
                    "block w-full text-center px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    plan.highlighted
                      ? "bg-accent hover:bg-accent-hover text-white shadow-glow"
                      : "border border-border/60 hover:border-border text-fg-muted hover:text-fg",
                  )}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">FlowForge</span>
            <span className="text-xs text-fg-muted ml-2">© 2025</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-fg-muted">
            <a href="https://github.com/flowforge/flowforge" className="hover:text-fg transition-colors flex items-center gap-1.5">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href="https://twitter.com/flowforge" className="hover:text-fg transition-colors flex items-center gap-1.5">
              <Twitter className="w-4 h-4" /> Twitter
            </a>
            <a href="/privacy" className="hover:text-fg transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-fg transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
