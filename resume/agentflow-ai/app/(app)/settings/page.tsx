'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Key, Cpu, Sliders, Save, CheckCircle2, AlertTriangle,
  Eye, EyeOff, RefreshCw, Zap, Database, Server,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Settings {
  openai_api_key: string
  model: string
  embedding_model: string
  max_tokens: number
  temperature: number
  demo_mode: boolean
  has_api_key: boolean
}

const MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Most capable, best for complex tasks' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & cost-effective, great for most tasks' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'High capability with 128k context' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fastest, lowest cost' },
]

const EMBEDDING_MODELS = [
  { value: 'text-embedding-3-small', label: 'text-embedding-3-small', description: 'Recommended — fast & efficient' },
  { value: 'text-embedding-3-large', label: 'text-embedding-3-large', description: 'Higher accuracy, slower' },
  { value: 'text-embedding-ada-002', label: 'text-embedding-ada-002', description: 'Legacy model' },
]

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-violet-400" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-white/30">{hint}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: Settings) => {
        setSettings(data)
        setApiKeyInput(data.openai_api_key)
      })
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        openai_api_key: apiKeyInput,
        model: settings.model,
        embedding_model: settings.embedding_model,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature,
        demo_mode: settings.demo_mode,
      }
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setSettings(s => s ? { ...s, demo_mode: data.demo_mode, has_api_key: !!apiKeyInput && !apiKeyInput.includes('•') } : s)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Refresh to get masked key from server
      fetch('/api/settings').then(r => r.json()).then((d: Settings) => {
        setSettings(d)
        setApiKeyInput(d.openai_api_key)
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-violet-400" />
      </div>
    )
  }

  if (!settings) return null

  const isDemo = settings.demo_mode || !settings.has_api_key

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-5">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-1">Configure your AI models, API keys, and system preferences.</p>
      </div>

      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
          isDemo
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
        )}
      >
        {isDemo ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
        <span>
          {isDemo
            ? 'Running in demo mode — AI responses are simulated. Add your OpenAI API key to enable real AI.'
            : 'OpenAI API key is configured. Real AI processing is active.'}
        </span>
      </motion.div>

      {/* API Keys */}
      <Section title="API Keys" icon={Key}>
        <Field
          label="OpenAI API Key"
          hint="Your key is saved to .env.local and applied immediately to the running server. Never share or commit this value."
        >
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 pr-10 text-sm text-white outline-none focus:border-violet-500/50 transition-colors font-mono placeholder-white/25"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
      </Section>

      {/* Model selection */}
      <Section title="Language Model" icon={Cpu}>
        <Field label="Chat / Agent Model" hint="Used by Planner, Executor, and Validator agents.">
          <div className="grid grid-cols-1 gap-2">
            {MODELS.map(m => (
              <button
                key={m.value}
                onClick={() => setSettings(s => s ? { ...s, model: m.value } : s)}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                  settings.model === m.value
                    ? 'bg-violet-500/15 border-violet-500/30 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white/80 hover:bg-white/[0.05]',
                )}
              >
                <div>
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{m.description}</div>
                </div>
                {settings.model === m.value && (
                  <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Embedding Model" hint="Used for knowledge base indexing and semantic search.">
          <div className="space-y-2">
            {EMBEDDING_MODELS.map(m => (
              <button
                key={m.value}
                onClick={() => setSettings(s => s ? { ...s, embedding_model: m.value } : s)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all',
                  settings.embedding_model === m.value
                    ? 'bg-cyan-500/10 border-cyan-500/25 text-white'
                    : 'bg-white/[0.03] border-white/[0.08] text-white/60 hover:text-white/80 hover:bg-white/[0.05]',
                )}
              >
                <div>
                  <div className="text-xs font-mono">{m.label}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{m.description}</div>
                </div>
                {settings.embedding_model === m.value && (
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      {/* Generation params */}
      <Section title="Generation Parameters" icon={Sliders}>
        <Field label={`Max Tokens: ${settings.max_tokens}`} hint="Maximum tokens per agent response. Higher = more detailed, slower, costlier.">
          <input
            type="range"
            min={256}
            max={4096}
            step={128}
            value={settings.max_tokens}
            onChange={e => setSettings(s => s ? { ...s, max_tokens: Number(e.target.value) } : s)}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-[10px] text-white/25 mt-1">
            <span>256</span><span>4096</span>
          </div>
        </Field>

        <Field label={`Temperature: ${settings.temperature.toFixed(2)}`} hint="Controls randomness. Lower = more deterministic. Recommended: 0.2–0.5 for agents.">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.temperature}
            onChange={e => setSettings(s => s ? { ...s, temperature: Number(e.target.value) } : s)}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-[10px] text-white/25 mt-1">
            <span>0 (deterministic)</span><span>1 (random)</span>
          </div>
        </Field>

        <Field label="Demo Mode">
          <button
            onClick={() => setSettings(s => s ? { ...s, demo_mode: !s.demo_mode } : s)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border w-full text-left transition-all',
              settings.demo_mode
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                : 'bg-white/[0.03] border-white/[0.08] text-white/50 hover:bg-white/[0.05]',
            )}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <div>
              <div className="text-sm font-medium">Demo Mode {settings.demo_mode ? 'On' : 'Off'}</div>
              <div className="text-[11px] text-white/40 mt-0.5">
                Forces simulated AI responses even when an API key is set. Useful for UI testing.
              </div>
            </div>
          </button>
        </Field>
      </Section>

      {/* System info */}
      <Section title="System Information" icon={Server}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Database', value: 'SQLite (local)', icon: Database },
            { label: 'Memory Store', value: process.env.REDIS_URL ? 'Redis' : 'In-memory', icon: Server },
            { label: 'Active Model', value: settings.model, icon: Cpu },
            { label: 'Mode', value: isDemo ? 'Demo' : 'Production', icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 text-[11px] text-white/35 mb-1">
                <Icon className="w-3 h-3" />
                {label}
              </div>
              <div className="text-sm font-medium text-white/80">{value}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm text-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4" />
            Settings saved
          </motion.div>
        )}
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-neon text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>
    </div>
  )
}
