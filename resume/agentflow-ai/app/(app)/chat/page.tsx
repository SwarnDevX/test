'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bot, User, ChevronDown, ChevronRight, Sparkles,
  Wrench, Clock, Zap, Brain, CheckCircle2, XCircle,
  Loader2, Copy, RotateCcw, Plus, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanStep { id: string; type: string; description: string; tool: string | null }
interface StepResult { stepId: string; success: boolean; toolUsed: string | null; result: string }
interface AgentEvent {
  type: string
  data: Record<string, unknown>
  timestamp: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  events?: AgentEvent[]
  confidence?: number
  qualityScore?: number
  totalTokens?: number
  totalCost?: number
  latencyMs?: number
  plan?: { goal: string; steps: PlanStep[] }
  results?: StepResult[]
  traceId?: string
  streaming?: boolean
}

interface Session { id: string; title: string; updatedAt: string; _count?: { messages: number } }

const AGENT_COLORS: Record<string, string> = {
  'agent:start': 'text-violet-400',
  'agent:plan': 'text-cyan-400',
  'agent:step': 'text-blue-400',
  'agent:tool': 'text-amber-400',
  'agent:validate': 'text-emerald-400',
  'agent:complete': 'text-emerald-400',
  'error': 'text-red-400',
}

const STEP_TYPE_ICONS: Record<string, string> = {
  retrieve: '🔍',
  execute: '⚡',
  analyze: '📊',
  generate: '✨',
  validate: '✅',
  transform: '🔄',
}

function MarkdownContent({ content }: { content: string }) {
  const html = content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|l|b|p])/gm, '')

  return (
    <div
      className="prose-ai"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  )
}

function AgentStepsPanel({ events, plan, results }: {
  events: AgentEvent[]
  plan?: Message['plan']
  results?: StepResult[]
}) {
  const [open, setOpen] = useState(false)

  if (!events || events.length === 0) return null

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        <ChevronRight className={cn('w-3 h-3 transition-transform', open && 'rotate-90')} />
        Agent execution trace ({events.length} events)
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-3 rounded-xl border border-white/[0.06] bg-black/20 space-y-2 max-h-64 overflow-y-auto">
              {plan && (
                <div className="pb-2 border-b border-white/[0.06]">
                  <div className="text-[11px] font-semibold text-violet-400 mb-1">PLAN GOAL</div>
                  <div className="text-[11px] text-white/60">{plan.goal}</div>
                  <div className="mt-2 space-y-1">
                    {plan.steps.map((s) => (
                      <div key={s.id} className="flex items-start gap-2 text-[11px]">
                        <span className="mt-0.5">{STEP_TYPE_ICONS[s.type] ?? '▸'}</span>
                        <span className="text-white/50">{s.description}</span>
                        {s.tool && <span className="ml-auto text-amber-400/70 shrink-0">{s.tool}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {events.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <span className={cn('font-mono shrink-0 mt-0.5', AGENT_COLORS[e.type] ?? 'text-white/40')}>
                    [{e.type.replace('agent:', '').toUpperCase()}]
                  </span>
                  <span className="text-white/50 truncate">
                    {typeof e.data === 'object' && e.data
                      ? (e.data.description as string) ?? (e.data.phase as string) ?? (e.data.error as string) ?? JSON.stringify(e.data).slice(0, 80)
                      : String(e.data)}
                  </span>
                </div>
              ))}
              {results && results.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] space-y-1">
                  {results.map((r) => (
                    <div key={r.stepId} className="flex items-center gap-2 text-[11px]">
                      {r.success
                        ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        : <XCircle className="w-3 h-3 text-red-400 shrink-0" />}
                      <span className="text-white/50">{r.result.slice(0, 80)}</span>
                      {r.toolUsed && <span className="ml-auto text-amber-400/60 shrink-0 text-[10px]">{r.toolUsed}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [msg.content])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3 group', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1',
          isUser
            ? 'bg-gradient-to-br from-violet-500 to-purple-600'
            : 'bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10',
        )}
      >
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-cyan-400" />}
      </div>

      {/* Bubble */}
      <div className={cn('max-w-[80%] space-y-1', isUser ? 'items-end flex flex-col' : '')}>
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3',
            isUser
              ? 'bg-gradient-to-br from-violet-600/40 to-purple-700/40 border border-violet-500/20 text-white text-sm'
              : 'glass text-sm',
          )}
        >
          {msg.streaming ? (
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
              <span>Thinking...</span>
            </div>
          ) : isUser ? (
            <p className="leading-relaxed">{msg.content}</p>
          ) : (
            <MarkdownContent content={msg.content} />
          )}

          {/* Copy button */}
          {!msg.streaming && (
            <button
              onClick={copy}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
            >
              <Copy className={cn('w-3 h-3', copied ? 'text-emerald-400' : 'text-white/30')} />
            </button>
          )}
        </div>

        {/* Metadata row */}
        {!isUser && !msg.streaming && (msg.confidence || msg.totalTokens || msg.latencyMs) && (
          <div className="flex items-center gap-3 px-1 flex-wrap">
            {msg.confidence !== undefined && (
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    msg.confidence > 0.8 ? 'bg-emerald-400' : msg.confidence > 0.6 ? 'bg-amber-400' : 'bg-red-400',
                  )}
                />
                <span className="text-[11px] text-white/40">
                  {Math.round(msg.confidence * 100)}% confidence
                </span>
              </div>
            )}
            {msg.totalTokens !== undefined && (
              <span className="text-[11px] text-white/30">{msg.totalTokens.toLocaleString()} tokens</span>
            )}
            {msg.latencyMs !== undefined && (
              <span className="text-[11px] text-white/30">{(msg.latencyMs / 1000).toFixed(1)}s</span>
            )}
            {msg.totalCost !== undefined && msg.totalCost > 0 && (
              <span className="text-[11px] text-white/30">${msg.totalCost.toFixed(5)}</span>
            )}
          </div>
        )}

        {/* Agent trace */}
        {!isUser && !msg.streaming && msg.events && (
          <AgentStepsPanel events={msg.events} plan={msg.plan} results={msg.results} />
        )}
      </div>
    </motion.div>
  )
}

function StreamingStatusBar({ events }: { events: AgentEvent[] }) {
  if (events.length === 0) return null
  const last = events[events.length - 1]
  const labels: Record<string, string> = {
    'agent:start': 'Starting agent...',
    'agent:plan': 'Creating execution plan...',
    'agent:step': `Executing: ${(last.data.description as string ?? '').slice(0, 40)}`,
    'agent:tool': `Using tool: ${last.data.tool as string ?? ''}`,
    'agent:validate': 'Validating response...',
    'agent:complete': 'Complete',
  }
  const label = labels[last.type] ?? last.type

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-xs text-white/40 mb-2 ml-11"
    >
      <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
      <span className={cn(AGENT_COLORS[last.type] ?? 'text-white/40')}>{label}</span>
    </motion.div>
  )
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [liveEvents, setLiveEvents] = useState<AgentEvent[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, liveEvents])

  const loadSessions = async () => {
    const res = await fetch('/api/chat/sessions').catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    setSessions(data.sessions ?? [])
  }

  const loadMessages = async (sessionId: string) => {
    setActiveSession(sessionId)
    const res = await fetch(`/api/chat/sessions/${sessionId}/messages`).catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    const msgs: Message[] = (data.messages ?? []).map((m: Record<string, unknown>) => {
      let meta: Record<string, unknown> = {}
      try { meta = JSON.parse(m.metadata as string ?? '{}') } catch {}
      return {
        id: m.id as string,
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
        confidence: meta.confidence as number | undefined,
        totalTokens: meta.totalTokens as number | undefined,
        totalCost: meta.totalCost as number | undefined,
        latencyMs: meta.latencyMs as number | undefined,
        traceId: meta.traceId as string | undefined,
      }
    })
    setMessages(msgs)
  }

  const newSession = async () => {
    const res = await fetch('/api/chat/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New Chat' }) })
    if (!res.ok) return
    const session = await res.json()
    setSessions((s) => [session, ...s])
    setActiveSession(session.id)
    setMessages([])
  }

  const sendMessage = async () => {
    if (!input.trim() || streaming) return
    const text = input.trim()
    setInput('')
    setStreaming(true)
    setLiveEvents([])

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text }
    const assistantMsg: Message = { id: `a-${Date.now()}`, role: 'assistant', content: '', streaming: true, events: [] }
    setMessages((m) => [...m, userMsg, assistantMsg])

    abortRef.current = new AbortController()
    const collectedEvents: AgentEvent[] = []

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: activeSession }),
        signal: abortRef.current.signal,
      })

      const newSessionId = res.headers.get('X-Session-Id')
      if (newSessionId && !activeSession) {
        setActiveSession(newSessionId)
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6)) as AgentEvent
            collectedEvents.push(event)
            setLiveEvents([...collectedEvents])

            if (event.type === 'agent:complete') {
              const d = event.data
              setMessages((msgs) =>
                msgs.map((m) =>
                  m.id === assistantMsg.id
                    ? {
                        ...m,
                        content: d.response as string ?? '',
                        streaming: false,
                        events: collectedEvents,
                        confidence: d.confidence as number,
                        qualityScore: d.qualityScore as number,
                        totalTokens: d.totalTokens as number,
                        totalCost: d.totalCost as number,
                        latencyMs: d.latencyMs as number,
                        traceId: d.traceId as string,
                        plan: d.plan as Message['plan'],
                        results: d.results as StepResult[],
                      }
                    : m,
                ),
              )
            } else if (event.type === 'error') {
              setMessages((msgs) =>
                msgs.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: `Error: ${event.data.error}`, streaming: false, events: collectedEvents }
                    : m,
                ),
              )
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((msgs) =>
          msgs.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: 'Connection failed. Please try again.', streaming: false }
              : m,
          ),
        )
      }
    } finally {
      setStreaming(false)
      setLiveEvents([])
      loadSessions()
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isCurrentlyStreaming = streaming && messages.at(-1)?.streaming

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sessions sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-white/[0.06]">
          <button
            onClick={newSession}
            className="w-full flex items-center gap-2 justify-center py-2 rounded-xl text-sm font-medium btn-neon text-white"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 && (
            <div className="text-center text-xs text-white/25 py-6">No sessions yet</div>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => loadMessages(s.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-xl transition-all text-xs',
                activeSession === s.id
                  ? 'bg-violet-500/15 border border-violet-500/25 text-violet-300'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]',
              )}
            >
              <div className="font-medium truncate">{s.title}</div>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] opacity-60">
                <MessageSquare className="w-2.5 h-2.5" />
                {s._count?.messages ?? 0} messages
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-semibold">AgentFlow AI</div>
              <div className="text-[11px] text-white/40">Planner → Executor → Validator</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streaming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/25"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[11px] text-violet-300">Processing</span>
              </motion.div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="pulse-dot w-1.5 h-1.5" />
              <span className="text-[11px] text-emerald-400">Live</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <div className="text-xl font-semibold text-white mb-2">AgentFlow AI</div>
                <div className="text-sm text-white/40 max-w-xs">
                  Ask anything. The multi-agent system will plan, execute, and validate your request.
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                {[
                  'Analyze business KPIs and suggest improvements',
                  'Create a workflow for customer onboarding',
                  'Search the knowledge base for Q4 insights',
                  'Help me build an automated reporting pipeline',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                    className="text-left p-3 rounded-xl glass text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.07] transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
          {isCurrentlyStreaming && <StreamingStatusBar events={liveEvents} />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 pb-6 pt-2">
          <div className="glass-strong rounded-2xl p-2 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask AgentFlow AI anything... (Enter to send, Shift+Enter for newline)"
              rows={1}
              style={{ resize: 'none', maxHeight: '120px' }}
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/25 px-3 py-2.5 leading-relaxed"
              onInput={(e) => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all',
                input.trim() && !streaming
                  ? 'btn-neon text-white'
                  : 'bg-white/5 text-white/20 cursor-not-allowed',
              )}
            >
              {streaming
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="text-[10px] text-white/20">
              Multi-agent orchestration • RAG-powered • Structured validation
            </div>
            <div className="flex items-center gap-3 text-[10px] text-white/20">
              <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Planner</span>
              <span className="flex items-center gap-1"><Wrench className="w-2.5 h-2.5" />Executor</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" />Validator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
