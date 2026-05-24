"use client"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer"
import { History, X } from "lucide-react"
import type { HistoryEntry } from "@/lib/types"

interface Props {
  history: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatTs(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function HistoryDrawer({ history, onSelect, open, onOpenChange }: Props) {
  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <History size={14} />
          History
        </button>
      </DrawerTrigger>
      <DrawerContent className="w-80 sm:w-96">
        <DrawerHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
          <DrawerTitle className="text-base font-semibold">History</DrawerTitle>
          <DrawerClose asChild>
            <button className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
              <X size={14} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No history yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">Generations will appear here.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    onSelect(entry)
                    onOpenChange(false)
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {entry.request.companyName}
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground capitalize">
                      {entry.request.mode === "dm" ? "DM" : "Email"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatTs(entry.timestamp)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
