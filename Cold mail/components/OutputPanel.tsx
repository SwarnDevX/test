"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"
import type { GenerateResponse } from "@/lib/types"
import { ResearchNotes } from "./ResearchNotes"
import { PainPointCard } from "./PainPointCard"
import { DraftBox } from "./DraftBox"

const EXAMPLE_INPUTS = `Company: Linear
URL: https://linear.app
Background:
4 yrs full-stack — TypeScript, Next.js, Postgres, tRPC.
Built a real-time collab editor handling 200 concurrent users at <80ms p95.
Cut p95 API latency 1.2s → 180ms via query batching at $LASTCO.
Strong on offline-first sync. Based in Hyderabad, open to remote.
Mode: DM`

function SectionCard({
  title,
  children,
  delay = 0,
}: {
  title: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <div
      className="animate-fade-in rounded-xl border border-border bg-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className ?? "h-4 w-full"}`} />
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <SkeletonBlock className="h-3 w-24" />
          </div>
          <div className="space-y-3 p-4">
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="h-3.5 w-4/5" />
            <SkeletonBlock className="h-3.5 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface Props {
  output: GenerateResponse | null
  loading: boolean
  error: string | null
  readOnly?: boolean
  onNew?: () => void
}

export function OutputPanel({ output, loading, error, readOnly, onNew }: Props) {
  const [exampleOpen, setExampleOpen] = useState(false)

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <p className="text-sm font-medium text-destructive">Something went wrong</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <span className="text-4xl" role="img" aria-label="outreach">
          ✉️
        </span>
        <p className="mt-4 text-base font-medium text-foreground">
          Fill in the form to generate your first message
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Claude will research the company and draft a targeted outreach
        </p>
        <button
          onClick={() => setExampleOpen((v) => !v)}
          className="mt-6 flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          See example inputs
          <ChevronDown
            size={12}
            className={`transition-transform ${exampleOpen ? "rotate-180" : ""}`}
          />
        </button>
        {exampleOpen && (
          <pre className="mt-3 max-w-xs rounded-lg border border-border bg-muted p-3 text-left font-mono text-xs text-foreground">
            {EXAMPLE_INPUTS}
          </pre>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">Viewing a past generation (read-only)</p>
          {onNew && (
            <button
              onClick={onNew}
              className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              New
            </button>
          )}
        </div>
      )}

      <SectionCard title="Research notes" delay={0}>
        <ResearchNotes notes={output.research} />
      </SectionCard>

      <SectionCard title="Pain point" delay={50}>
        <PainPointCard painPoint={output.painPoint} />
      </SectionCard>

      <SectionCard title="Why I fit" delay={100}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex-1 text-sm text-muted-foreground">{output.whyFit}</p>
          <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {output.tone}
          </span>
        </div>
      </SectionCard>

      <SectionCard title="Draft" delay={150}>
        <DraftBox draft={output.draft} alternateOpening={output.alternateOpening} />
      </SectionCard>
    </div>
  )
}
