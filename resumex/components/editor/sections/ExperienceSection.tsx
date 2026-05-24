"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { ExperienceEntry } from "@/types";

interface Props {
  entries: ExperienceEntry[];
  onChange: (entries: ExperienceEntry[]) => void;
}

function BulletList({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  function update(i: number, v: string) {
    const next = [...bullets];
    next[i] = v;
    onChange(next);
  }
  function add() { onChange([...bullets, ""]); }
  function remove(i: number) { onChange(bullets.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-400 block">Bullet points</label>
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="text-slate-600 mt-2.5 text-sm">•</span>
          <input
            className="input-glass flex-1 text-xs"
            value={b}
            onChange={(e) => update(i, e.target.value)}
            placeholder="Led team of engineers to ship X, resulting in Y% improvement"
          />
          <button onClick={() => remove(i)} className="mt-2 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1">
        <Plus className="w-3 h-3" />
        Add bullet
      </button>
    </div>
  );
}

function EntryCard({ entry, onChange, onDelete }: {
  entry: ExperienceEntry;
  onChange: (e: ExperienceEntry) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  function field(key: keyof ExperienceEntry, value: string | boolean) {
    onChange({ ...entry, [key]: value });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <GripVertical className="w-4 h-4 text-slate-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{entry.position || "New Position"}</p>
          <p className="text-xs text-slate-500 truncate">{entry.company || "Company"}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Job Title *</label>
                  <input className="input-glass text-xs" value={entry.position} onChange={(e) => field("position", e.target.value)} placeholder="Software Engineer" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Company *</label>
                  <input className="input-glass text-xs" value={entry.company} onChange={(e) => field("company", e.target.value)} placeholder="Google" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Location</label>
                <input className="input-glass text-xs" value={entry.location} onChange={(e) => field("location", e.target.value)} placeholder="Mountain View, CA" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Date</label>
                  <input className="input-glass text-xs" value={entry.startDate} onChange={(e) => field("startDate", e.target.value)} placeholder="Jan 2022" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">End Date</label>
                  <input className="input-glass text-xs" value={entry.endDate} onChange={(e) => field("endDate", e.target.value)} placeholder="Present" disabled={entry.current} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input type="checkbox" checked={entry.current} onChange={(e) => field("current", e.target.checked)} className="w-3.5 h-3.5 accent-indigo-500" />
                Currently working here
              </label>
              <BulletList bullets={entry.description} onChange={(description) => onChange({ ...entry, description })} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ExperienceSection({ entries, onChange }: Props) {
  function addEntry() {
    onChange([
      ...entries,
      {
        id: generateId(),
        company: "",
        position: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: [""],
      },
    ]);
  }

  function updateEntry(id: string, entry: ExperienceEntry) {
    onChange(entries.map((e) => (e.id === id ? entry : e)));
  }

  function removeEntry(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Work Experience</h2>
          <p className="text-xs text-slate-500">{entries.length} position{entries.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={addEntry} className="btn-primary text-xs py-2 px-3">
          <Plus className="w-3.5 h-3.5" />
          Add position
        </button>
      </div>

      <div className="space-y-3">
        {entries.length === 0 && (
          <div className="py-10 text-center text-slate-600 text-sm">
            No experience added yet. Click &ldquo;Add position&rdquo; to start.
          </div>
        )}
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onChange={(e) => updateEntry(entry.id, e)}
            onDelete={() => removeEntry(entry.id)}
          />
        ))}
      </div>
    </div>
  );
}
