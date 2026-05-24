import type { ResearchNote } from "@/lib/types"

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}

interface Props {
  notes: ResearchNote[]
}

export function ResearchNotes({ notes }: Props) {
  return (
    <div className="space-y-3">
      {notes.map((note, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm leading-relaxed text-foreground">{note.note}</p>
            {note.url && (
              <a
                href={note.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                <span className="size-1.5 rounded-full bg-current opacity-60" />
                {getDomain(note.url)}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
