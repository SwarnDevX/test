"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layout, GitBranch, Play, ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatRelative } from "@/lib/utils";

const spring = { ease: [0.32, 0.72, 0, 1] as const, duration: 0.25 };

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = trpc.template.list.useQuery({ search: search || undefined });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Templates</h1>
        <p className="text-sm text-fg-muted">Pre-built workflows you can clone and customize</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates…"
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/60 bg-bg-surface-1 text-sm placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-bg-surface-1 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map((tmpl, i) => (
            <motion.div
              key={tmpl.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.04 }}
              className="p-5 rounded-xl border border-border/60 bg-bg-surface-1 hover:bg-bg-surface-2 hover:border-accent/30 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Layout className="w-4 h-4 text-accent" />
                </div>
                <ArrowRight className="w-4 h-4 text-fg-muted group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-medium text-sm mb-1">{tmpl.name}</h3>
              {tmpl.description && (
                <p className="text-xs text-fg-muted mb-3 line-clamp-2">{tmpl.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-fg-muted">
                {tmpl.cloneCount > 0 && (
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {tmpl.cloneCount} uses
                  </span>
                )}
              </div>
            </motion.div>
          ))}
          {!data?.items?.length && (
            <div className="col-span-3 py-16 text-center">
              <Layout className="w-10 h-10 text-fg-muted/30 mx-auto mb-3" />
              <p className="text-sm text-fg-muted">No templates found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
