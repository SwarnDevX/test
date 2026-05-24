"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { EducationEntry } from "@/types";

interface Props {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

function EntryCard({ entry, onChange, onDelete }: {
  entry: EducationEntry;
  onChange: (e: EducationEntry) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [courseInput, setCourseInput] = useState("");

  function field(key: keyof EducationEntry, value: string) {
    onChange({ ...entry, [key]: value });
  }

  function addCourse() {
    if (!courseInput.trim()) return;
    onChange({ ...entry, courses: [...(entry.courses ?? []), courseInput.trim()] });
    setCourseInput("");
  }

  function removeCourse(i: number) {
    onChange({ ...entry, courses: entry.courses?.filter((_, idx) => idx !== i) ?? [] });
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <GripVertical className="w-4 h-4 text-slate-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{entry.institution || "Institution"}</p>
          <p className="text-xs text-slate-500 truncate">{entry.degree} {entry.field ? `in ${entry.field}` : ""}</p>
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
              <div>
                <label className="text-xs text-slate-400 block mb-1">Institution *</label>
                <input className="input-glass text-xs" value={entry.institution} onChange={(e) => field("institution", e.target.value)} placeholder="Stanford University" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Degree</label>
                  <input className="input-glass text-xs" value={entry.degree} onChange={(e) => field("degree", e.target.value)} placeholder="B.S." />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Field of Study</label>
                  <input className="input-glass text-xs" value={entry.field} onChange={(e) => field("field", e.target.value)} placeholder="Computer Science" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Location</label>
                <input className="input-glass text-xs" value={entry.location} onChange={(e) => field("location", e.target.value)} placeholder="Stanford, CA" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start</label>
                  <input className="input-glass text-xs" value={entry.startDate} onChange={(e) => field("startDate", e.target.value)} placeholder="Sep 2020" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">End</label>
                  <input className="input-glass text-xs" value={entry.endDate} onChange={(e) => field("endDate", e.target.value)} placeholder="Jun 2024" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">GPA</label>
                  <input className="input-glass text-xs" value={entry.gpa ?? ""} onChange={(e) => field("gpa", e.target.value)} placeholder="3.9/4.0" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">Relevant Courses</label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="input-glass text-xs flex-1"
                    value={courseInput}
                    onChange={(e) => setCourseInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCourse()}
                    placeholder="Type course and press Enter"
                  />
                  <button onClick={addCourse} className="btn-ghost text-xs px-2.5 py-1.5">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(entry.courses ?? []).map((c, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-slate-300"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      {c}
                      <button onClick={() => removeCourse(i)} className="text-slate-500 hover:text-white ml-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EducationSection({ entries, onChange }: Props) {
  function addEntry() {
    onChange([...entries, {
      id: generateId(),
      institution: "",
      degree: "",
      field: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
      courses: [],
    }]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Education</h2>
          <p className="text-xs text-slate-500">{entries.length} institution{entries.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={addEntry} className="btn-primary text-xs py-2 px-3">
          <Plus className="w-3.5 h-3.5" />
          Add education
        </button>
      </div>
      <div className="space-y-3">
        {entries.length === 0 && (
          <div className="py-10 text-center text-slate-600 text-sm">No education added yet.</div>
        )}
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
