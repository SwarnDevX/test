"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Plus, Trash2, FileText, Globe, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatRelative } from "@/lib/utils";

function CreateKBModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [error, setError] = useState("");

  const createMutation = trpc.knowledge.create.useMutation({
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (err) => setError(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 rounded-xl border border-border/60 bg-bg-surface-3">
        <h2 className="font-semibold mb-4">Create knowledge base</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company docs"
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What docs are in here?"
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Embedding model</label>
            <select
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="text-embedding-3-small">OpenAI text-embedding-3-small</option>
              <option value="text-embedding-3-large">OpenAI text-embedding-3-large</option>
              <option value="text-embedding-ada-002">OpenAI ada-002</option>
            </select>
          </div>
          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-border/60 rounded-lg text-sm hover:bg-bg-surface-2 transition-colors">Cancel</button>
            <button
              onClick={() => createMutation.mutate({ name, description, embeddingModel, chunkSize: 1000, chunkOverlap: 200 })}
              disabled={createMutation.isPending || !name}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-lg text-sm font-medium"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading, refetch } = trpc.knowledge.list.useQuery();
  const deleteMutation = trpc.knowledge.delete.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge bases</h1>
          <p className="text-sm text-fg-muted mt-0.5">RAG-ready document stores with pgvector search</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          New knowledge base
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-bg-surface-1 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((kb) => (
            <Link
              key={kb.id}
              href={`/knowledge/${kb.id}`}
              className="p-5 rounded-xl border border-border/60 bg-bg-surface-1 hover:bg-bg-surface-2 hover:border-accent/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-accent" />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm("Delete this knowledge base?")) deleteMutation.mutate({ id: kb.id });
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-danger/10 text-fg-muted hover:text-danger transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="font-medium text-sm mb-1">{kb.name}</div>
              {kb.description && <p className="text-xs text-fg-muted mb-2 line-clamp-2">{kb.description}</p>}
              <div className="flex items-center gap-3 text-xs text-fg-muted">
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{kb._count?.documents ?? 0} docs</span>
                <span>Updated {formatRelative(kb.updatedAt)}</span>
              </div>
            </Link>
          ))}
          {!data?.length && (
            <div className="col-span-3 py-16 text-center rounded-xl border border-dashed border-border/60">
              <Database className="w-10 h-10 text-fg-muted/30 mx-auto mb-3" />
              <p className="text-sm text-fg-muted">No knowledge bases yet</p>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateKBModal onClose={() => setShowCreate(false)} onSuccess={() => refetch()} />}
    </div>
  );
}
