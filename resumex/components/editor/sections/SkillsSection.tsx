"use client";

import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import type { SkillsData } from "@/types";

interface Props {
  data: SkillsData;
  onChange: (data: SkillsData) => void;
}

export function SkillsSection({ data, onChange }: Props) {
  const [newCategory, setNewCategory] = useState("");
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});

  function addCategory() {
    if (!newCategory.trim() || data[newCategory.trim()]) return;
    onChange({ ...data, [newCategory.trim()]: [] });
    setNewCategory("");
  }

  function removeCategory(cat: string) {
    const next = { ...data };
    delete next[cat];
    onChange(next);
  }

  function addSkill(cat: string) {
    const val = (skillInputs[cat] ?? "").trim();
    if (!val) return;
    onChange({ ...data, [cat]: [...(data[cat] ?? []), val] });
    setSkillInputs((prev) => ({ ...prev, [cat]: "" }));
  }

  function removeSkill(cat: string, idx: number) {
    onChange({ ...data, [cat]: data[cat].filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Technical Skills</h2>
        <p className="text-xs text-slate-500">Group your skills by category (Languages, Frameworks, Tools…)</p>
      </div>

      <div className="space-y-4">
        {Object.entries(data).map(([cat, skills]) => (
          <div
            key={cat}
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">{cat}</span>
              <button onClick={() => removeCategory(cat)} className="text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-slate-200"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  {skill}
                  <button onClick={() => removeSkill(cat, i)} className="text-indigo-400/60 hover:text-white ml-0.5 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                className="input-glass text-xs flex-1"
                value={skillInputs[cat] ?? ""}
                onChange={(e) => setSkillInputs((prev) => ({ ...prev, [cat]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addSkill(cat)}
                placeholder={`Add ${cat.toLowerCase()} skill…`}
              />
              <button onClick={() => addSkill(cat)} className="btn-ghost text-xs px-2.5 py-1.5">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="input-glass text-xs flex-1"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
          placeholder="New category (e.g. Languages)"
        />
        <button onClick={addCategory} className="btn-primary text-xs px-3 py-2">
          <Plus className="w-3.5 h-3.5" />
          Add category
        </button>
      </div>
    </div>
  );
}
