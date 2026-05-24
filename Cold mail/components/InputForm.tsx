"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import type { GenerateRequest, Mode } from "@/lib/types"

const BACKGROUND_PLACEHOLDER = `4 yrs full-stack — TypeScript, Next.js, Postgres, tRPC.
Built a real-time collab editor handling 200 concurrent users at <80ms p95.
Cut p95 API latency 1.2s → 180ms via query batching at $LASTCO.
Strong on offline-first sync. Based in Hyderabad, open to remote.`

interface Props {
  onSubmit: (req: GenerateRequest) => void
  loading: boolean
}

function isValidUrl(val: string): boolean {
  try {
    const u = new URL(val)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}

export function InputForm({ onSubmit, loading }: Props) {
  const [companyName, setCompanyName] = useState("")
  const [companyUrl, setCompanyUrl] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [background, setBackground] = useState("")
  const [mode, setMode] = useState<Mode>("dm")
  const [urlTouched, setUrlTouched] = useState(false)

  const urlInvalid = urlTouched && companyUrl.length > 0 && !isValidUrl(companyUrl)
  const canSubmit =
    !loading &&
    companyName.trim().length > 0 &&
    isValidUrl(companyUrl) &&
    background.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      companyName: companyName.trim(),
      companyUrl: companyUrl.trim(),
      recipientName: recipientName.trim() || undefined,
      background: background.trim(),
      mode,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground" htmlFor="company-name">
          Company name
        </label>
        <input
          id="company-name"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Linear"
          disabled={loading}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground" htmlFor="company-url">
          Company website
        </label>
        <input
          id="company-url"
          type="url"
          value={companyUrl}
          onChange={(e) => setCompanyUrl(e.target.value)}
          onBlur={() => setUrlTouched(true)}
          placeholder="https://linear.app"
          disabled={loading}
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 disabled:opacity-50 ${
            urlInvalid
              ? "border-destructive focus:border-destructive focus:ring-destructive/20"
              : "border-border focus:border-ring focus:ring-ring/20"
          }`}
        />
        {urlInvalid && (
          <p className="text-xs text-destructive">Enter a valid URL including https://</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground" htmlFor="recipient">
          Recipient name{" "}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="recipient"
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          placeholder="Karri Saarinen"
          disabled={loading}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground" htmlFor="background">
          My background
        </label>
        <textarea
          id="background"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder={BACKGROUND_PLACEHOLDER}
          disabled={loading}
          rows={5}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">Mode</span>
        <div className="flex rounded-lg border border-border bg-muted p-0.5">
          {(["dm", "cold_email"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={loading}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                mode === m
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "dm" ? "DM" : "Cold email"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Researching…
          </>
        ) : (
          "Generate"
        )}
      </button>

      {loading && (
        <p className="text-center text-xs text-muted-foreground">
          Running web searches — this takes 30–60 s
        </p>
      )}
    </form>
  )
}
