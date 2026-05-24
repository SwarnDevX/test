"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SummarySection({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Professional Summary</h2>
        <p className="text-xs text-slate-500">A 2-3 sentence overview of your experience and goals</p>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-400 block mb-1.5">Summary</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Results-driven engineer with X years of experience building..."
          rows={5}
          className="input-glass resize-none leading-relaxed"
        />
        <p className="text-xs text-slate-600 mt-1.5">{value.length} characters</p>
      </div>
    </div>
  );
}
