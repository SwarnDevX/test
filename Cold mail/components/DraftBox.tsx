"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import type { Draft } from "@/lib/types"

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy to clipboard"
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className ?? ""}`}
    >
      {copied ? (
        <>
          <Check size={12} className="text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy size={12} />
          Copy
        </>
      )}
    </button>
  )
}

interface Props {
  draft: Draft
  alternateOpening: string
}

export function DraftBox({ draft, alternateOpening }: Props) {
  const [body, setBody] = useState(
    draft.mode === "dm" ? draft.body : (draft as { mode: "cold_email"; subject: string; body: string }).body
  )
  const [subject, setSubject] = useState(
    draft.mode === "cold_email"
      ? (draft as { mode: "cold_email"; subject: string; body: string }).subject
      : ""
  )

  function swapOpening() {
    const sentences = body.split(/(?<=[.!?])\s+/)
    if (sentences.length <= 1) {
      setBody(alternateOpening + " " + body)
    } else {
      setBody(alternateOpening + " " + sentences.slice(1).join(" "))
    }
  }

  const currentBody = body
  const currentSubject = subject

  if (draft.mode === "dm") {
    return (
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute right-2 top-2 z-10">
            <CopyButton text={currentBody} />
          </div>
          <textarea
            value={currentBody}
            onChange={(e) => setBody(e.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-background p-3 pr-20 font-mono text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
            style={{ minHeight: "120px" }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{wordCount(currentBody)} words</p>
        <AlternateOpening alt={alternateOpening} onSwap={swapOpening} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Subject</label>
          <CopyButton text={currentSubject} />
        </div>
        <input
          type="text"
          value={currentSubject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Body</label>
          <CopyButton text={currentBody} />
        </div>
        <textarea
          value={currentBody}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-none rounded-lg border border-border bg-background p-3 font-mono text-sm leading-relaxed text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
          style={{ minHeight: "160px" }}
        />
        <p className="text-xs text-muted-foreground">{wordCount(currentBody)} words</p>
      </div>

      <AlternateOpening alt={alternateOpening} onSwap={swapOpening} />
    </div>
  )
}

function AlternateOpening({ alt, onSwap }: { alt: string; onSwap: () => void }) {
  if (!alt) return null
  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Alternate opening</p>
          <p className="font-mono text-sm text-foreground">{alt}</p>
        </div>
        <button
          onClick={onSwap}
          className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Swap in
        </button>
      </div>
    </div>
  )
}
