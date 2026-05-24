import type { PainPoint } from "@/lib/types"

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

interface Props {
  painPoint: PainPoint
}

export function PainPointCard({ painPoint }: Props) {
  const isInsufficient = painPoint.summary === "INSUFFICIENT_EVIDENCE"

  if (isInsufficient) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
          Couldn't find a defensible pain point
        </p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-500">
          Try a larger or more public company, or add more specifics to your background (frameworks, scale, industry experience).
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card pl-0 overflow-hidden">
      <div className="flex">
        <div className="w-1 shrink-0 bg-primary rounded-l-lg" />
        <div className="p-4 space-y-3">
          <p className="text-base font-medium leading-snug text-foreground">{painPoint.summary}</p>
          {painPoint.evidenceUrl && (
            <a
              href={painPoint.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <span className="size-1.5 rounded-full bg-primary opacity-70" />
              {getDomain(painPoint.evidenceUrl)}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
