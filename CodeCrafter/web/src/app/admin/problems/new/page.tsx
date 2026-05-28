"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface TestCaseInput { input: string; expectedOutput: string; sortOrder: number; }
interface ExampleInput  { input: string; output: string; explanation: string; sortOrder: number; }

const LANGUAGES = ["java", "python", "cpp", "javascript", "go", "c", "rust"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

export default function NewProblemPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "", number: "", slug: "", difficulty: "MEDIUM",
    bodyMarkdown: "", constraintsMarkdown: "", followUpMarkdown: "",
    timeLimitMs: 2000, memoryLimitMb: 256, isPremium: false,
    tagSlugs: "" as string,
  });
  const [examples, setExamples]         = useState<ExampleInput[]>([{ input: "", output: "", explanation: "", sortOrder: 0 }]);
  const [sampleCases, setSampleCases]   = useState<TestCaseInput[]>([{ input: "", expectedOutput: "", sortOrder: 0 }]);
  const [hiddenCases, setHiddenCases]   = useState<TestCaseInput[]>([{ input: "", expectedOutput: "", sortOrder: 0 }]);
  const [starterCode, setStarterCode]   = useState<Record<string, string>>(
    Object.fromEntries(LANGUAGES.map(l => [l, ""]))
  );

  const mutation = useMutation({
    mutationFn: (payload: object) => api.post("/admin/problems", payload).then(r => r.data),
    onSuccess: (data) => {
      toast.success("Problem created");
      router.push(`/admin/problems/${data.slug}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      number: parseInt(form.number),
      tagSlugs: form.tagSlugs.split(",").map(s => s.trim()).filter(Boolean),
      examples,
      sampleTestCases: sampleCases,
      hiddenTestCases: hiddenCases,
      starterCode: Object.fromEntries(
        Object.entries(starterCode).filter(([, v]) => v.trim())
      ),
    });
  };

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/problems" className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">New Problem</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info */}
        <Section title="Basic Info">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" required>
              <input className={input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </Field>
            <Field label="Number" required>
              <input className={input} type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} required />
            </Field>
            <Field label="Slug" required>
              <input className={input} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} required placeholder="two-sum" />
            </Field>
            <Field label="Difficulty">
              <select className={input} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Time Limit (ms)">
              <input className={input} type="number" value={form.timeLimitMs} onChange={e => setForm(f => ({ ...f, timeLimitMs: +e.target.value }))} />
            </Field>
            <Field label="Memory Limit (MB)">
              <input className={input} type="number" value={form.memoryLimitMb} onChange={e => setForm(f => ({ ...f, memoryLimitMb: +e.target.value }))} />
            </Field>
          </div>
          <Field label="Tags (comma-separated slugs)">
            <input className={input} value={form.tagSlugs} onChange={e => setForm(f => ({ ...f, tagSlugs: e.target.value }))} placeholder="array, hash-table, two-pointers" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
            <input type="checkbox" checked={form.isPremium} onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} className="rounded" />
            Premium only
          </label>
        </Section>

        {/* Content */}
        <Section title="Problem Content">
          <Field label="Body (Markdown)" required>
            <textarea className={`${input} min-h-[200px] font-mono text-xs`} value={form.bodyMarkdown}
              onChange={e => setForm(f => ({ ...f, bodyMarkdown: e.target.value }))} required />
          </Field>
          <Field label="Constraints (Markdown)">
            <textarea className={`${input} min-h-[80px] font-mono text-xs`} value={form.constraintsMarkdown}
              onChange={e => setForm(f => ({ ...f, constraintsMarkdown: e.target.value }))} />
          </Field>
          <Field label="Follow-up (Markdown)">
            <textarea className={`${input} min-h-[60px] font-mono text-xs`} value={form.followUpMarkdown}
              onChange={e => setForm(f => ({ ...f, followUpMarkdown: e.target.value }))} />
          </Field>
        </Section>

        {/* Examples */}
        <Section title="Examples (visible)" onAdd={() => setExamples(ex => [...ex, { input: "", output: "", explanation: "", sortOrder: ex.length }])}>
          {examples.map((ex, i) => (
            <div key={i} className="rounded-lg border border-zinc-800 p-4 space-y-3 relative">
              <button type="button" onClick={() => setExamples(ex => ex.filter((_, j) => j !== i))}
                className="absolute top-3 right-3 text-zinc-600 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              <p className="text-xs text-zinc-400 font-medium">Example {i + 1}</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Input"><textarea className={`${input} font-mono text-xs min-h-[60px]`} value={ex.input} onChange={e => setExamples(arr => arr.map((x, j) => j === i ? { ...x, input: e.target.value } : x))} /></Field>
                <Field label="Output"><textarea className={`${input} font-mono text-xs min-h-[60px]`} value={ex.output} onChange={e => setExamples(arr => arr.map((x, j) => j === i ? { ...x, output: e.target.value } : x))} /></Field>
              </div>
              <Field label="Explanation"><input className={input} value={ex.explanation} onChange={e => setExamples(arr => arr.map((x, j) => j === i ? { ...x, explanation: e.target.value } : x))} /></Field>
            </div>
          ))}
        </Section>

        {/* Sample test cases */}
        <TestCaseSection title="Sample Test Cases (visible to users)" cases={sampleCases} onChange={setSampleCases} />

        {/* Hidden test cases */}
        <TestCaseSection title="Hidden Test Cases (judge only)" cases={hiddenCases} onChange={setHiddenCases} />

        {/* Starter code */}
        <Section title="Starter Code">
          <div className="space-y-3">
            {LANGUAGES.map(lang => (
              <Field key={lang} label={lang}>
                <textarea
                  className={`${input} font-mono text-xs min-h-[80px]`}
                  value={starterCode[lang]}
                  onChange={e => setStarterCode(s => ({ ...s, [lang]: e.target.value }))}
                  placeholder={`// ${lang} starter code`}
                />
              </Field>
            ))}
          </div>
        </Section>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <Link href="/admin/problems" className="px-5 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-500 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {mutation.isPending ? "Creating…" : "Create Problem"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const input = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-400">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

function Section({ title, children, onAdd }: { title: string; children: React.ReactNode; onAdd?: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h2 className="text-sm font-semibold text-zinc-300">{title}</h2>
        {onAdd && (
          <button type="button" onClick={onAdd} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            <Plus className="h-3.5 w-3.5" />Add
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function TestCaseSection({ title, cases, onChange }: {
  title: string;
  cases: TestCaseInput[];
  onChange: React.Dispatch<React.SetStateAction<TestCaseInput[]>>;
}) {
  return (
    <Section title={title} onAdd={() => onChange(c => [...c, { input: "", expectedOutput: "", sortOrder: c.length }])}>
      {cases.map((tc, i) => (
        <div key={i} className="rounded-lg border border-zinc-800 p-4 space-y-3 relative">
          <button type="button" onClick={() => onChange(c => c.filter((_, j) => j !== i))}
            className="absolute top-3 right-3 text-zinc-600 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
          <p className="text-xs text-zinc-400 font-medium">Case {i + 1}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Input"><textarea className={`${input} font-mono text-xs min-h-[60px]`} value={tc.input} onChange={e => onChange(arr => arr.map((x, j) => j === i ? { ...x, input: e.target.value } : x))} /></Field>
            <Field label="Expected Output"><textarea className={`${input} font-mono text-xs min-h-[60px]`} value={tc.expectedOutput} onChange={e => onChange(arr => arr.map((x, j) => j === i ? { ...x, expectedOutput: e.target.value } : x))} /></Field>
          </div>
        </div>
      ))}
    </Section>
  );
}
