"use client";

import { useState } from "react";
import { Key, Plus, Trash2, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatRelative } from "@/lib/utils";

const CREDENTIAL_TYPES = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google_ai", label: "Google AI" },
  { value: "slack_oauth", label: "Slack" },
  { value: "github_token", label: "GitHub" },
  { value: "stripe", label: "Stripe" },
  { value: "sendgrid", label: "SendGrid" },
  { value: "hubspot", label: "HubSpot" },
  { value: "notion", label: "Notion" },
  { value: "airtable", label: "Airtable" },
  { value: "generic_api_key", label: "Generic API Key" },
];

function AddCredentialModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("openai");
  const [data, setData] = useState<Record<string, string>>({ apiKey: "" });
  const [error, setError] = useState("");

  const createMutation = trpc.credential.create.useMutation({
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (err) => setError(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 rounded-xl border border-border/60 bg-bg-surface-3">
        <h2 className="font-semibold mb-4">Add credential</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My OpenAI Key"
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              {CREDENTIAL_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">API Key</label>
            <input
              type="password"
              value={data.apiKey}
              onChange={(e) => setData({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded-lg border border-border/60 bg-bg-surface-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border/60 rounded-lg text-sm hover:bg-bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => createMutation.mutate({ name, type: type as any, service: type, data })}
              disabled={createMutation.isPending || !name || !data.apiKey}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save credential"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CredentialsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading, refetch } = trpc.credential.list.useQuery();
  const deleteMutation = trpc.credential.delete.useMutation({ onSuccess: () => refetch() });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Credentials</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            Securely stored with envelope encryption. Never logged.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add credential
        </button>
      </div>

      <div className="mb-4 p-3 rounded-lg border border-border/60 bg-bg-surface-1 flex items-center gap-3">
        <Shield className="w-4 h-4 text-success flex-shrink-0" />
        <p className="text-xs text-fg-muted">
          Credentials are encrypted with AES-256-GCM using per-credential DEKs wrapped by your master key.
          The plaintext never appears in logs, API responses, or the database.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-bg-surface-1 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {data?.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-bg-surface-1"
            >
              <Key className="w-4 h-4 text-fg-muted flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{cred.name}</div>
                <div className="text-xs text-fg-muted">
                  {CREDENTIAL_TYPES.find((ct) => ct.value === cred.type)?.label ?? cred.type} ·
                  Added {formatRelative(cred.createdAt)}
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Delete this credential?")) deleteMutation.mutate({ id: cred.id });
                }}
                className="p-1.5 rounded hover:bg-danger/10 text-fg-muted hover:text-danger transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {!data?.length && (
            <div className="py-16 text-center rounded-xl border border-dashed border-border/60">
              <Key className="w-10 h-10 text-fg-muted/30 mx-auto mb-3" />
              <p className="text-sm text-fg-muted">No credentials yet</p>
            </div>
          )}
        </div>
      )}

      {showAdd && <AddCredentialModal onClose={() => setShowAdd(false)} onSuccess={() => refetch()} />}
    </div>
  );
}
