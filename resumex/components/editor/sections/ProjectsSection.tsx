"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { ProjectEntry } from "@/types";

interface Props {
  entries: ProjectEntry[];
  onChange: (entries: ProjectEntry[]) => void;
}

function TechTags({ techs, onChange }: { techs: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (!v) return;
    onChange([...techs, v]);
    setInput("");
  }
  return (
    <div>
      <label className="text-xs text-slate-400 block mb-1.5">Technologies</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {techs.map((t, i) => (
          <span
            key={i}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-cyan-300"
            style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}
          >
            {t}
            <button onClick={() => onChange(techs.filter((_, idx) => idx !== i))} className="text-cyan-500/60 hover:text-white transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input-glass text-xs flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="React, TypeScript, Postgres…"
        />
        <button onClick={add} className="btn-ghost text-xs px-2.5 py-1.5">Add</button>
      </div>
    </div>
  );
}

function EntryCard({ entry, onChange, onDelete }: {
  entry: ProjectEntry;
  onChange: (e: ProjectEntry) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  function field(key: keyof ProjectEntry, value: string) {
    onChange({ ...entry, [key]: value });
  }

  function updateBullets(bullets: string[]) { onChange({ ...entry, bullets }); }
  function addBullet() { updateBullets([...entry.bullets, ""]); }
  function removeBullet(i: number) { updateBullets(entry.bullets.filter((_, idx) => idx !== i)); }
  function updateBullet(i: number, v: string) {
    const next = [...entry.bullets];
    next[i] = v;
    updateBullets(next);
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <GripVertical className="w-4 h-4 text-slate-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{entry.name || "New Project"}</p>
          <p className="text-xs text-slate-500 truncate">{entry.technologies.join(", ") || "No technologies yet"}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-slate-600 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Project Name *</label>
                <input className="input-glass text-xs" value={entry.name} onChange={(e) => field("name", e.target.value)} placeholder="My Awesome Project" />
              </div>
              <TechTags techs={entry.technologies} onChange={(technologies) => onChange({ ...entry, technologies })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">GitHub URL</label>
                  <input className="input-glass text-xs" value={entry.github ?? ""} onChange={(e) => field("github", e.target.value)} placeholder="https://github.com/…" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Live URL</label>
                  <input className="input-glass text-xs" value={entry.url ?? ""} onChange={(e) => field("url", e.target.value)} placeholder="https://…" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Bullet Points</label>
                {entry.bullets.map((b, i) => (
                  <div key={i} className="flex gap-2 items-start mb-2">
                    <span className="text-slate-600 mt-2.5 text-sm flex-shrink-0">•</span>
                    <input
                      className="input-glass text-xs flex-1"
                      value={b}
                      onChange={(e) => updateBullet(i, e.target.value)}
                      placeholder="Built X using Y, achieving Z"
                    />
                    <button onClick={() => removeBullet(i)} className="mt-2 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button onClick={addBullet} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1">
                  <Plus className="w-3 h-3" /> Add bullet
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProjectsSection({ entries, onChange }: Props) {
  function addEntry() {
    onChange([...entries, {
      id: generateId(),
      name: "",
      description: "",
      technologies: [],
      github: "",
      url: "",
      bullets: [""],
    }]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Projects</h2>
          <p className="text-xs text-slate-500">{entries.length} project{entries.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={addEntry} className="btn-primary text-xs py-2 px-3">
          <Plus className="w-3.5 h-3.5" />
          Add project
        </button>
      </div>
      <div className="space-y-3">
        {entries.length === 0 && <div className="py-10 text-center text-slate-600 text-sm">No projects added yet.</div>}
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onChange={(e) => onChange(entries.map((x) => (x.id === entry.id ? e : x)))}
            onDelete={() => onChange(entries.filter((x) => x.id !== entry.id))}
          />
        ))}
      </div>
    </div>
  );
}
