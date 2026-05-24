"use client"

import { useEffect, useState } from "react"
import { InputForm } from "@/components/InputForm"
import { OutputPanel } from "@/components/OutputPanel"
import { ThemeToggle } from "@/components/ThemeToggle"
import { HistoryDrawer } from "@/components/HistoryDrawer"
import type { GenerateRequest, GenerateResponse, HistoryEntry } from "@/lib/types"
import { AlertCircle } from "lucide-react"

const HISTORY_KEY = "reachout_history"
const MAX_HISTORY = 20

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
}

export default function Home() {
  const [output, setOutput] = useState<GenerateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  async function handleGenerate(req: GenerateRequest) {
    setLoading(true)
    setError(null)
    setOutput(null)
    setReadOnly(false)
    setApiKeyMissing(false)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        if (data.error === "no_api_key") {
          setApiKeyMissing(true)
          return
        }
        setError(data.message ?? "An error occurred. Please try again.")
        return
      }

      setOutput(data as GenerateResponse)

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        request: req,
        response: data as GenerateResponse,
      }
      const updated = [entry, ...history].slice(0, MAX_HISTORY)
      setHistory(updated)
      saveHistory(updated)
    } catch {
      setError("Network error — check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleHistorySelect(entry: HistoryEntry) {
    setOutput(entry.response)
    setError(null)
    setApiKeyMissing(false)
    setReadOnly(true)
  }

  function handleNew() {
    setOutput(null)
    setReadOnly(false)
    setError(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight text-foreground">Reachout</span>
            <span className="hidden rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">
              beta
            </span>
          </div>
          <div className="flex items-center gap-1">
            <HistoryDrawer
              history={history}
              onSelect={handleHistorySelect}
              open={historyOpen}
              onOpenChange={setHistoryOpen}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* API key banner */}
      {apiKeyMissing && (
        <div className="border-b border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
          <div className="mx-auto flex max-w-[1120px] items-start gap-3 px-4 py-3 lg:px-8">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm">
              <p className="font-medium text-red-800 dark:text-red-300">
                ANTHROPIC_API_KEY is not configured
              </p>
              <p className="mt-0.5 text-red-700 dark:text-red-400">
                Copy{" "}
                <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-xs dark:bg-red-900/50">
                  .env.local.example
                </code>{" "}
                to{" "}
                <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-xs dark:bg-red-900/50">
                  .env.local
                </code>{" "}
                and add your API key from{" "}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  console.anthropic.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[40fr_60fr] lg:gap-12">
          {/* Left — form */}
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Research &amp; outreach
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter a company and your background — Claude runs real web searches and writes a targeted message.
              </p>
            </div>
            <InputForm onSubmit={handleGenerate} loading={loading} />
          </div>

          {/* Right — output */}
          <div>
            <OutputPanel
              output={output}
              loading={loading}
              error={error}
              readOnly={readOnly}
              onNew={handleNew}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
