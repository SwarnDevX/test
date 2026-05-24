"use client";

import { Plus, Trash2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { CertificationEntry } from "@/types";

interface Props {
  entries: CertificationEntry[];
  onChange: (entries: CertificationEntry[]) => void;
}

export function CertificationsSection({ entries, onChange }: Props) {
  function add() {
    onChange([...entries, { id: generateId(), name: "", issuer: "", date: "", url: "" }]);
  }

  function update(id: string, key: keyof CertificationEntry, value: string) {
    onChange(entries.map((e) => (e.id === id ? { ...e, [key]: value } : e)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Certifications</h2>
          <p className="text-xs text-slate-500">{entries.length} certification{entries.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={add} className="btn-primary text-xs py-2 px-3">
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      <div className="space-y-3">
        {entries.length === 0 && <div className="py-10 text-center text-slate-600 text-sm">No certifications added yet.</div>}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl p-4 space-y-3"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-white">{entry.name || "New Certification"}</p>
              <button onClick={() => onChange(entries.filter((e) => e.id !== entry.id))} className="text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Certification Name *</label>
              <input className="input-glass text-xs" value={entry.name} onChange={(e) => update(entry.id, "name", e.target.value)} placeholder="AWS Solutions Architect" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Issuer</label>
                <input className="input-glass text-xs" value={entry.issuer} onChange={(e) => update(entry.id, "issuer", e.target.value)} placeholder="Amazon Web Services" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input className="input-glass text-xs" value={entry.date} onChange={(e) => update(entry.id, "date", e.target.value)} placeholder="2024" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">URL (optional)</label>
              <input className="input-glass text-xs" value={entry.url ?? ""} onChange={(e) => update(entry.id, "url", e.target.value)} placeholder="https://…" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
