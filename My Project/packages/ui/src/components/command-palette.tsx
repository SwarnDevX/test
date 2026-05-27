"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Search, Settings, Workflow, Zap } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils.js";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  category: "workflow" | "execution" | "node" | "settings" | "docs" | "action";
  shortcut?: string[];
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: CommandItem[];
  onSearch?: (query: string) => void;
  placeholder?: string;
}

const CATEGORY_ICONS: Record<CommandItem["category"], React.ReactNode> = {
  workflow: <Workflow className="h-3.5 w-3.5" />,
  execution: <Zap className="h-3.5 w-3.5" />,
  node: <FileText className="h-3.5 w-3.5" />,
  settings: <Settings className="h-3.5 w-3.5" />,
  docs: <FileText className="h-3.5 w-3.5" />,
  action: <Zap className="h-3.5 w-3.5" />,
};

const CATEGORY_LABELS: Record<CommandItem["category"], string> = {
  workflow: "Workflows",
  execution: "Executions",
  node: "Nodes",
  settings: "Settings",
  docs: "Documentation",
  action: "Actions",
};

export function CommandPalette({ open, onOpenChange, items = [], onSearch, placeholder }: CommandPaletteProps) {
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  React.useEffect(() => {
    onSearch?.(search);
  }, [search, onSearch]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of items) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return map;
  }, [items]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2"
          >
            <Command
              className={cn(
                "overflow-hidden rounded-[14px]",
                "border border-[oklch(var(--border)/0.5)]",
                "bg-[oklch(var(--bg-surface-4))] shadow-lg",
              )}
              shouldFilter={false}
            >
              <div className="flex items-center border-b border-[oklch(var(--border)/0.5)] px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 text-[oklch(var(--fg-muted))]" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder={placeholder ?? "Search workflows, nodes, settings..."}
                  className={cn(
                    "flex h-11 w-full bg-transparent text-sm text-[oklch(var(--fg))]",
                    "placeholder:text-[oklch(var(--fg-muted))]",
                    "outline-none",
                  )}
                />
                <kbd className="ml-2 shrink-0 rounded-[4px] border border-[oklch(var(--border)/0.5)] bg-[oklch(var(--bg-surface-3))] px-1.5 py-0.5 text-xs text-[oklch(var(--fg-muted))]">
                  Esc
                </kbd>
              </div>

              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-[oklch(var(--fg-muted))]">
                  No results found.
                </Command.Empty>

                {Array.from(grouped.entries()).map(([category, categoryItems]) => (
                  <Command.Group
                    key={category}
                    heading={CATEGORY_LABELS[category as CommandItem["category"]]}
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[oklch(var(--fg-muted))]"
                  >
                    {categoryItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => {
                          item.onSelect();
                          onOpenChange(false);
                        }}
                        className={cn(
                          "flex cursor-default select-none items-center gap-2.5 rounded-[8px] px-2 py-2",
                          "text-sm text-[oklch(var(--fg))]",
                          "data-[selected=true]:bg-[oklch(var(--bg-surface-5))]",
                          "transition-colors duration-100",
                        )}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-[oklch(var(--bg-surface-3))] text-[oklch(var(--fg-muted))]">
                          {item.icon ?? CATEGORY_ICONS[item.category as CommandItem["category"]]}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{item.label}</p>
                          {item.description && (
                            <p className="truncate text-xs text-[oklch(var(--fg-muted))]">{item.description}</p>
                          )}
                        </div>
                        {item.shortcut && (
                          <div className="flex gap-1">
                            {item.shortcut.map((key) => (
                              <kbd
                                key={key}
                                className="rounded-[4px] border border-[oklch(var(--border)/0.5)] bg-[oklch(var(--bg-surface-3))] px-1.5 py-0.5 text-xs text-[oklch(var(--fg-subtle))]"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              <div className="border-t border-[oklch(var(--border)/0.5)] px-3 py-2 flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-[oklch(var(--fg-subtle))]">
                  <kbd className="rounded border border-[oklch(var(--border)/0.4)] bg-[oklch(var(--bg-surface-3))] px-1 py-0.5">↑↓</kbd>
                  <span>navigate</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[oklch(var(--fg-subtle))]">
                  <kbd className="rounded border border-[oklch(var(--border)/0.4)] bg-[oklch(var(--bg-surface-3))] px-1 py-0.5">↵</kbd>
                  <span>select</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
