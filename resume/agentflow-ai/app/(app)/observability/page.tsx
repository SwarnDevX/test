'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Coins, Clock, CheckCircle, TrendingUp, Activity,
  RefreshCw, Zap, Database, AlertTriangle, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Metrics {
  totalRequests: number
  totalTokens: number
  totalCost: number
  avgLatencyMs: number
  errorRate: number
  requestsToday: number
  tokensToday: number
  costToday: number
}

interface ObsData {
  metrics: Metrics
  charts: { hourly: number[] }
  recentEvents: Array<{
    id: string
    eventType: string
    agent?: string
    tokens?: number
    latencyMs?: number
    cost?: number
    createdAt: string
  }>
  recentTraces: Array<{
    id: string
    traceType: string
    status: string
    totalTokens: number
    totalCost: number
    latencyMs: number
    createdAt: string
    inputPreview: string
  }>
}

function MiniBarChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-px h-16">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex items-end">
          <div
            className="w-full rounded-sm bg-gradient-to-t from-violet-500/60 to-violet-400/30 transition-all duration-300"
            style={{ height: `${Math.max(2, (v / max) * 100)}%`, minHeight: v > 0 ? '3px' : '1px' }}
          />
        </div>
      ))}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', `bg-${color}-500/10 border border-${color}-500/20`)}>
          <Icon className={cn('w-4.5 h-4.5', `text-${color}-400`)} />
        </div>
        {trend && (
          <div className={cn('badge text-[10px]',
            trend === 'up' ? 'badge-emerald' : trend === 'down' ? 'badge-red' : 'badge-slate',
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
      {sub && <div className="text-[11px] text-white/25 mt-0.5">{sub}</div>}
    </motion.div>
  )
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  agent_step: 'badge-violet',
  tool_call: 'badge-amber',
  error: 'badge-red',
  rag_query: 'badge-cyan',
  workflow_step: 'badge-emerald',
  token_usage: 'badge-slate',
}

export default function ObservabilityPage() {
  const [data, setData] = useState<ObsData | null>(null)
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch(`/api/observability?range=${range}`).catch(() => null)
    if (res?.ok) setData(await res.json())
    setLoading(false)
  }, [range])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [load, autoRefresh])

  const m = data?.metrics
  const successRate = m ? Math.round((1 - m.errorRate) * 100) : 100

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-semibold">Observability</div>
            <div className="text-[11px] text-white/40">Real-time system metrics</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 glass rounded-xl">
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  range === r ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:text-white/70',
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setAutoRefresh((v) => !v) }}
            className={cn(
              'p-2 rounded-xl glass transition-all',
              autoRefresh ? 'text-emerald-400' : 'text-white/30',
            )}
            title={autoRefresh ? 'Auto-refresh on' : 'Auto-refresh off'}
          >
            <RefreshCw className={cn('w-4 h-4', autoRefresh && 'animate-spin-slow')} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Total Requests"
            value={loading ? '—' : (m?.totalRequests ?? 0).toLocaleString()}
            sub={`${m?.requestsToday ?? 0} today`}
            color="violet"
            trend="up"
          />
          <StatCard
            icon={Coins}
            label="Total Tokens"
            value={loading ? '—' : (m?.totalTokens ?? 0).toLocaleString()}
            sub={`${(m?.tokensToday ?? 0).toLocaleString()} today`}
            color="cyan"
          />
          <StatCard
            icon={Clock}
            label="Avg Latency"
            value={loading ? '—' : `${((m?.avgLatencyMs ?? 0) / 1000).toFixed(2)}s`}
            color="amber"
          />
          <StatCard
            icon={CheckCircle}
            label="Success Rate"
            value={loading ? '—' : `${successRate}%`}
            sub={`${((m?.totalCost ?? 0)).toFixed(4)} USD cost`}
            color="emerald"
            trend={successRate >= 95 ? 'up' : successRate >= 80 ? 'neutral' : 'down'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity chart */}
          <div className="lg:col-span-2 glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white/80">Hourly Activity</div>
              <span className="badge badge-violet">last 24h</span>
            </div>
            {loading ? (
              <div className="h-16 skeleton rounded-xl" />
            ) : (
              <MiniBarChart data={data?.charts.hourly ?? Array(24).fill(0)} />
            )}
            <div className="flex justify-between mt-2 text-[10px] text-white/25">
              <span>24h ago</span>
              <span>now</span>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="glass-card p-5">
            <div className="text-sm font-medium text-white/80 mb-4">Cost Breakdown</div>
            <div className="space-y-3">
              {[
                { label: 'GPT-4o', pct: 67, color: 'bg-violet-500' },
                { label: 'Embeddings', pct: 18, color: 'bg-cyan-500' },
                { label: 'GPT-4o-mini', pct: 10, color: 'bg-emerald-500' },
                { label: 'Other', pct: 5, color: 'bg-white/20' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/50">{item.label}</span>
                    <span className="text-white/40">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', item.color)}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <div className="text-xs text-white/40">Total spend ({range})</div>
              <div className="text-lg font-bold text-white mt-0.5">
                ${(m?.totalCost ?? 0).toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        {/* Recent traces */}
        {data?.recentTraces && data.recentTraces.length > 0 && (
          <div className="glass-card p-5">
            <div className="text-sm font-medium text-white/80 mb-4">Recent Agent Traces</div>
            <div className="space-y-2">
              {data.recentTraces.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    t.status === 'completed' ? 'bg-emerald-400' : t.status === 'failed' ? 'bg-red-400' : 'bg-amber-400',
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/70 truncate">{t.inputPreview || t.traceType}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-white/25">{t.totalTokens} tokens</span>
                      <span className="text-[10px] text-white/25">{(t.latencyMs / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                  <div className={cn('badge', t.status === 'completed' ? 'badge-emerald' : t.status === 'failed' ? 'badge-red' : 'badge-amber')}>
                    {t.status}
                  </div>
                  <div className="text-[10px] text-white/25 shrink-0">
                    {new Date(t.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live events */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-white/80">Live Event Log</div>
            {autoRefresh && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <div className="pulse-dot w-1.5 h-1.5" />
                Streaming
              </div>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 skeleton rounded-lg" />
              ))}
            </div>
          ) : !data?.recentEvents?.length ? (
            <div className="text-center py-8 text-white/25 text-sm">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No events yet — start chatting to generate activity
            </div>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {data.recentEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] text-xs">
                  <span className={cn('badge text-[10px] shrink-0', EVENT_TYPE_COLORS[e.eventType] ?? 'badge-slate')}>
                    {e.eventType.replace('_', ' ')}
                  </span>
                  {e.agent && <span className="text-white/40">{e.agent}</span>}
                  <div className="flex items-center gap-3 ml-auto text-white/25 shrink-0">
                    {e.tokens !== undefined && e.tokens > 0 && <span>{e.tokens} tok</span>}
                    {e.latencyMs !== undefined && <span>{e.latencyMs}ms</span>}
                    <span>{new Date(e.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
