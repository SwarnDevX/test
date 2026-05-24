'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Table, CheckCircle2, Loader2,
  Trash2, Database, Search, AlertCircle, X, Hash,
  FileIcon, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KbDoc {
  id: string
  name: string
  type: string
  size: number
  status: 'processing' | 'embedded' | 'error'
  chunkCount: number
  createdAt: string
}

interface SearchResult {
  docId: string
  docName: string
  score: number
  content: string
  chunkIndex: number
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  csv: Table,
  txt: FileIcon,
  md: FileText,
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

function DocCard({ doc, onDelete }: { doc: KbDoc; onDelete: (id: string) => void }) {
  const Icon = TYPE_ICONS[doc.type] ?? FileIcon

  const statusColor = {
    processing: 'badge-amber',
    embedded: 'badge-emerald',
    error: 'badge-red',
  }[doc.status]

  const statusLabel = {
    processing: 'Processing',
    embedded: 'Ready',
    error: 'Error',
  }[doc.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-4 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">{doc.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('badge', statusColor)}>
              {doc.status === 'processing' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
              {doc.status === 'embedded' && <CheckCircle2 className="w-2.5 h-2.5" />}
              {doc.status === 'error' && <AlertCircle className="w-2.5 h-2.5" />}
              {statusLabel}
            </span>
            <span className="text-[11px] text-white/30">{formatBytes(doc.size)}</span>
            {doc.chunkCount > 0 && (
              <span className="text-[11px] text-white/30 flex items-center gap-0.5">
                <Hash className="w-2.5 h-2.5" />{doc.chunkCount} chunks
              </span>
            )}
          </div>
          <div className="text-[10px] text-white/20 mt-1">
            {new Date(doc.createdAt).toLocaleString()}
          </div>
        </div>
        <button
          onClick={() => onDelete(doc.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {doc.status === 'processing' && (
        <div className="mt-3">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            />
          </div>
        </div>
      )}

      {doc.status === 'embedded' && (
        <div className="mt-3">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full w-full" />
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KbDoc[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadDocs()
    return () => { if (pollRef.current) clearTimeout(pollRef.current) }
  }, [])

  const loadDocs = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/knowledge').catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setDocs(data.documents ?? [])
      // Poll if any docs are still processing
      if ((data.documents ?? []).some((d: KbDoc) => d.status === 'processing')) {
        pollRef.current = setTimeout(loadDocs, 2000)
      }
    }
    setLoading(false)
  }, [])

  const upload = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files)
    const allowed = ['pdf', 'txt', 'csv', 'md']
    const valid = fileArr.filter((f) => allowed.includes(f.name.split('.').pop()?.toLowerCase() ?? ''))
    if (valid.length === 0) return

    setUploading(true)
    for (const file of valid) {
      const form = new FormData()
      form.append('file', file)
      await fetch('/api/rag/upload', { method: 'POST', body: form }).catch(() => null)
    }
    setUploading(false)
    await loadDocs()
    pollRef.current = setTimeout(loadDocs, 2000)
  }, [loadDocs])

  const deleteDoc = async (id: string) => {
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' }).catch(() => null)
    setDocs((d) => d.filter((doc) => doc.id !== id))
  }

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    const res = await fetch('/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, topK: 8 }),
    }).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setResults(data.results ?? [])
    }
    setSearching(false)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
  }, [upload])

  const embeddedDocs = docs.filter((d) => d.status === 'embedded')
  const processingDocs = docs.filter((d) => d.status === 'processing')
  const totalChunks = docs.reduce((s, d) => s + d.chunkCount, 0)

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel: Documents */}
      <div className="w-96 shrink-0 border-r border-white/[0.06] flex flex-col overflow-hidden">
        {/* Stats row */}
        <div className="p-4 border-b border-white/[0.06] grid grid-cols-3 gap-3">
          {[
            { label: 'Documents', value: docs.length, color: 'text-violet-400' },
            { label: 'Ready', value: embeddedDocs.length, color: 'text-emerald-400' },
            { label: 'Chunks', value: totalChunks.toLocaleString(), color: 'text-cyan-400' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-3 text-center">
              <div className={cn('text-xl font-bold', s.color)}>{s.value}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Upload zone */}
        <div className="p-3">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all',
              dragging
                ? 'border-violet-400/60 bg-violet-500/10'
                : 'border-white/[0.08] hover:border-violet-400/30 hover:bg-violet-500/5',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.csv,.md"
              className="hidden"
              onChange={(e) => e.target.files && upload(e.target.files)}
            />
            {uploading ? (
              <Loader2 className="w-6 h-6 text-violet-400 mx-auto animate-spin" />
            ) : (
              <Upload className={cn('w-6 h-6 mx-auto mb-2', dragging ? 'text-violet-400' : 'text-white/30')} />
            )}
            <div className="text-xs text-white/40">
              {uploading ? 'Uploading...' : dragging ? 'Drop files here' : 'Drop files or click to upload'}
            </div>
            <div className="text-[10px] text-white/20 mt-1">PDF, TXT, CSV, Markdown</div>
          </div>
        </div>

        {/* Doc list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-xl" />
            ))
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-white/25 text-sm">
              <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No documents yet
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {docs.map((doc) => (
                <DocCard key={doc.id} doc={doc} onDelete={deleteDoc} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Right panel: Search */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
              <Search className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-semibold">Semantic Search</div>
              <div className="text-[11px] text-white/40">Query your knowledge base</div>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="What would you like to find?"
              className="glass-input flex-1 px-4 py-2.5 text-sm"
            />
            <button
              onClick={search}
              disabled={!query.trim() || searching}
              className="px-4 py-2.5 btn-neon text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {results.length === 0 && !searching && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Search className="w-10 h-10 text-white/15 mb-3" />
              <div className="text-sm text-white/30">
                {embeddedDocs.length === 0
                  ? 'Upload documents to start searching'
                  : 'Enter a query to search across your documents'}
              </div>
            </div>
          )}
          {results.map((r, i) => (
            <motion.div
              key={`${r.docId}-${r.chunkIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-medium text-white/70">{r.docName}</span>
                  <span className="badge badge-slate">chunk {r.chunkIndex}</span>
                </div>
                <div
                  className={cn(
                    'badge',
                    r.score > 0.7 ? 'badge-emerald' : r.score > 0.4 ? 'badge-amber' : 'badge-slate',
                  )}
                >
                  {Math.round(r.score * 100)}% match
                </div>
              </div>
              <p className="text-xs text-white/55 leading-relaxed line-clamp-4">{r.content}</p>
            </motion.div>
          ))}
          {processingDocs.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs text-amber-300/70">
                {processingDocs.length} document{processingDocs.length > 1 ? 's' : ''} being processed...
              </span>
              <button onClick={loadDocs} className="ml-auto p-1 hover:bg-white/5 rounded">
                <RefreshCw className="w-3 h-3 text-white/30" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
