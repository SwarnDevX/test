'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal, Brain, Wrench, ChevronDown, ChevronRight,
  Copy, Check, Clock, Layers, RefreshCw, Zap, CheckCircle2, XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TraceStep {
  id: string
  agent: string
  stepType: string
  input: string
  output?: string
  tokensUsed: number
  latencyMs: number
  error?: string
  createdAt: string
}

interface Trace {
  id: string
  traceType: string
  status: string
  input: string
  output?: string
  totalTokens: number
  totalCost: number
  latencyMs: number
  createdAt: string
  steps: TraceStep[]
}

const AGENT_ICONS: Record<string, typeof Brain> = {
  planner: Brain,
  executor: Zap,
  validator: CheckCircle2,
}

const STEP_TYPE_COLORS: Record<string, string> = {
  plan: 'badge-violet',
  execute: 'badge-cyan',
  validate: 'badge-emerald',
  tool_call: 'badge-amber',
  rag_retrieve: 'badge-blue-400',
}

function StepCard({ step }: { step: TraceStep }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<'input' | 'output' | null>(null)

  const copy = (text: string, which: 'input' | 'output') => {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 1500)
  }

  const Icon = AGENT_ICONS[step.agent] ?? Terminal
  const hasError = !!step.error
  const inputParsed = (() => { try { return JSON.stringify(JSON.parse(step.input), null, 2) } catch { return step.input } })()
  const outputParsed = step.output ? (() => { try { return JSON.stringify(JSON.parse(step.output), null, 2) } catch { return step.output } })() : null

  return (
    <div className={cn('glass-card overflow-hidden', hasError && 'border-red-500/20')}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
          hasError ? 'bg-red-500/10' : 'bg-violet-500/10',
        )}>
          {hasError
            ? <XCircle className="w-3.5 h-3.5 text-red-400" />
            : <Icon className="w-3.5 h-3.5 text-violet-400" />}
        </div>
        <div className="flex-1 flex items-center gap-2 text-left">
          <span className="text-xs font-semibold text-white/80 capitalize">{step.agent}</span>
          <span className={cn('badge', STEP_TYPE_COLORS[step.stepType] ?? 'badge-slate')}>
            {step.stepType.replace('_', ' ')}
          </span>
          {hasError && <span className="badge badge-red">error</span>}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />{step.latencyMs}ms
          </span>
          {step.tokensUsed > 0 && <span>{step.tokensUsed} tok</span>}
        </div>
        <ChevronRight className={cn('w-3.5 h-3.5 text-white/30 transition-transform', open && 'rotate-90')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 py-3 space-y-3">
              {/* Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Input</span>
                  <button
                    onClick={() => copy(inputParsed, 'input')}
                    className="p-1 rounded hover:bg-white/10"
                  >
                    {copied === 'input'
                      ? <Check className="w-3 h-3 text-emerald-400" />
                      : <Copy className="w-3 h-3 text-white/25" />}
                  </button>
                </div>
                <pre className="text-[11px] text-white/55 bg-black/20 rounded-lg p-3 overflow-x-auto max-h-40 whitespace-pre-wrap font-mono leading-relaxed">
                  {inputParsed.slice(0, 800)}
                  {inputParsed.length > 800 && '\n... (truncated)'}
                </pre>
              </div>

              {/* Output */}
              {outputParsed && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Output</span>
                    <button
                      onClick={() => copy(outputParsed, 'output')}
                      className="p-1 rounded hover:bg-white/10"
                    >
                      {copied === 'output'
                        ? <Check className="w-3 h-3 text-emerald-400" />
                        : <Copy className="w-3 h-3 text-white/25" />}
                    </button>
                  </div>
                  <pre className="text-[11px] text-white/55 bg-black/20 rounded-lg p-3 overflow-x-auto max-h-40 whitespace-pre-wrap font-mono leading-relaxed">
                    {outputParsed.slice(0, 800)}
                    {outputParsed.length > 800 && '\n... (truncated)'}
                  </pre>
                </div>
              )}

              {/* Error */}
              {step.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="text-xs text-red-300">{step.error}</span>
                </div>
              )}

              <div className="text-[10px] text-white/20">
                {new Date(step.createdAt).toLocaleString()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TraceCard({ trace }: { trace: Trace }) {
  const [open, setOpen] = useState(false)

  const inputMsg = (() => { try { return JSON.parse(trace.input)?.message ?? trace.input } catch { return trace.input } })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className={cn(
          'w-2 h-2 rounded-full shrink-0',
          trace.status === 'completed' ? 'bg-emerald-400' : trace.status === 'failed' ? 'bg-red-400' : 'bg-amber-400 animate-pulse',
        )} />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/75 truncate">{inputMsg.slice(0, 80)}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn('badge text-[10px]',
              trace.status === 'completed' ? 'badge-emerald' : trace.status === 'failed' ? 'badge-red' : 'badge-amber',
            )}>
              {trace.status}
            </span>
            <span className="badge badge-slate text-[10px]">{trace.traceType}</span>
            <span className="text-[10px] text-white/25">{trace.steps.length} steps</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/25 shrink-0">
          <span>{trace.totalTokens} tokens</span>
          <span>${trace.totalCost.toFixed(5)}</span>
          <span>{(trace.latencyMs / 1000).toFixed(1)}s</span>
        </div>
        <ChevronRight className={cn('w-3.5 h-3.5 text-white/30 transition-transform shrink-0', open && 'rotate-90')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-4 py-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-white/30">
                <span>Trace ID: <code className="font-mono text-white/50">{trace.id.slice(0, 16)}...</code></span>
                <span>{new Date(trace.createdAt).toLocaleString()}</span>
              </div>
              {trace.steps.map((step) => (
                <StepCard key={step.id} step={step} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function DebugPage() {
  const [traces, setTraces] = useState<Trace[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch('/api/debug/traces').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setTraces(data.traces ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-semibold">Debug Panel</div>
            <div className="text-[11px] text-white/40">Full agent execution transparency</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-[11px] text-white/35">
            <span className="flex items-center gap-1.5"><Brain className="w-3 h-3 text-violet-400" />Planner</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-cyan-400" />Executor</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" />Validator</span>
          </div>
          <button
            onClick={load}
            className="p-2 glass rounded-xl text-white/40 hover:text-white/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Traces */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-2xl" />
          ))
        ) : traces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Layers className="w-10 h-10 text-white/15 mb-3" />
            <div className="text-sm text-white/30">No traces yet</div>
            <div className="text-xs text-white/20 mt-1">
              Send a message in AI Chat to generate execution traces
            </div>
          </div>
        ) : (
          traces.map((t) => <TraceCard key={t.id} trace={t} />)
        )}
      </div>
    </div>
  )
}
