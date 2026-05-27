"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  ChevronLeft, RotateCcw, Send, Loader2,
  CheckCircle2, XCircle, AlertTriangle, Clock,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ProblemDescription } from "@/components/problem/ProblemDescription";
import { ConsolePanel } from "@/components/problem/ConsolePanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSubmission } from "@/hooks/useSubmission";
import type { ProblemDetail, RunResult } from "@/types/problems";

const SUPPORTED_LANGUAGES = [
  { value: "java",       label: "Java" },
  { value: "python",     label: "Python 3" },
  { value: "cpp",        label: "C++" },
  { value: "c",          label: "C" },
  { value: "javascript", label: "JavaScript" },
  { value: "go",         label: "Go" },
  { value: "rust",       label: "Rust" },
];

const VERDICT_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  ACCEPTED:            { icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-400", label: "Accepted" },
  WRONG_ANSWER:        { icon: <XCircle className="h-4 w-4" />,      color: "text-red-400",     label: "Wrong Answer" },
  COMPILE_ERROR:       { icon: <AlertTriangle className="h-4 w-4" />,color: "text-amber-400",   label: "Compile Error" },
  RUNTIME_ERROR:       { icon: <XCircle className="h-4 w-4" />,      color: "text-red-400",     label: "Runtime Error" },
  TIME_LIMIT_EXCEEDED: { icon: <Clock className="h-4 w-4" />,        color: "text-amber-400",   label: "Time Limit Exceeded" },
  MEMORY_LIMIT_EXCEEDED:{ icon: <AlertTriangle className="h-4 w-4" />,color: "text-amber-400",  label: "Memory Limit Exceeded" },
  OUTPUT_LIMIT_EXCEEDED:{ icon: <AlertTriangle className="h-4 w-4" />,color: "text-amber-400",  label: "Output Limit Exceeded" },
  INTERNAL_ERROR:      { icon: <AlertTriangle className="h-4 w-4" />,color: "text-zinc-400",    label: "Internal Error" },
};

export default function ProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const { state: submitState, submit, reset: resetSubmit } = useSubmission();

  const { data: problem, isLoading, isError } = useQuery<ProblemDetail>({
    queryKey: ["problem", slug],
    queryFn: () => api.get(`/problems/${slug}`).then(r => r.data),
    staleTime: 60_000,
  });

  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!problem?.starterCode) return;
    const storageKey = `cc_code_${slug}_${language}`;
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    setCode(saved ?? problem.starterCode[language] ?? "");
  }, [problem, language, slug]);

  const handleCodeChange = useCallback((val: string) => {
    setCode(val);
    if (typeof window !== "undefined") {
      localStorage.setItem(`cc_code_${slug}_${language}`, val);
    }
  }, [slug, language]);

  const handleLanguageChange = useCallback((lang: string) => {
    setLanguage(lang);
    setRunResult(null);
    resetSubmit();
  }, [resetSubmit]);

  const handleReset = useCallback(() => {
    if (!problem) return;
    setCode(problem.starterCode[language] ?? "");
    if (typeof window !== "undefined") {
      localStorage.removeItem(`cc_code_${slug}_${language}`);
    }
    resetSubmit();
  }, [problem, language, slug, resetSubmit]);

  const handleRun = useCallback(async (customInput?: string) => {
    if (!problem) return;
    setIsRunning(true);
    setRunResult(null);
    resetSubmit();
    try {
      const body: Record<string, unknown> = { language, sourceCode: code };
      if (customInput !== undefined) body.customInput = customInput;
      const res = await api.post(`/problems/${slug}/run`, body);
      setRunResult(res.data);
    } catch (err: unknown) {
      setRunResult({
        verdict: "INTERNAL_ERROR",
        results: [],
        compileError: err instanceof Error ? err.message : "Run failed",
      });
    } finally {
      setIsRunning(false);
    }
  }, [problem, slug, language, code, resetSubmit]);

  const handleSubmit = useCallback(() => {
    if (!problem) return;
    setRunResult(null);
    submit(slug, language, code);
  }, [problem, slug, language, code, submit]);

  const sampleInput = problem?.sampleTestCases?.[0]?.input ?? "";
  const isSubmitting = submitState.status === "submitting" || submitState.status === "queued" || submitState.status === "running";
  const verdictMeta = submitState.verdict ? VERDICT_META[submitState.verdict.verdict] : null;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-100 gap-4">
        <p className="text-zinc-400">Problem not found.</p>
        <Link href="/problems" className="text-emerald-400 hover:underline text-sm">← Back to Problems</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 h-11 border-b border-zinc-800 flex-shrink-0 bg-zinc-950 z-10">
        <Link href="/problems"
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 transition-colors text-sm">
          <ChevronLeft className="h-4 w-4" />Problems
        </Link>
        <div className="h-4 w-px bg-zinc-700 mx-1" />
        {isLoading
          ? <Skeleton className="h-4 w-48" />
          : <span className="text-sm font-medium truncate max-w-xs">{problem?.number}. {problem?.title}</span>}

        <div className="ml-auto flex items-center gap-2">
          {/* Verdict badge */}
          {verdictMeta && submitState.verdict && (
            <span className={`flex items-center gap-1.5 text-xs font-semibold ${verdictMeta.color}`}>
              {verdictMeta.icon}{verdictMeta.label}
              {submitState.verdict.runtimeMs != null && (
                <span className="text-zinc-500 font-normal ml-1">{submitState.verdict.runtimeMs}ms</span>
              )}
            </span>
          )}

          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-7 w-36 text-xs border-zinc-700 bg-zinc-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map(l => (
                <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="sm" onClick={handleReset}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100" title="Reset to starter code">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <Button size="sm" onClick={handleSubmit}
            disabled={isSubmitting || isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 h-7 text-xs gap-1.5 px-3">
            {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {isSubmitting ? "Judging…" : "Submit"}
          </Button>
        </div>
      </header>

      {/* Submission verdict panel (appears below header) */}
      {submitState.verdict && (
        <SubmissionVerdictPanel verdict={submitState.verdict} onDismiss={resetSubmit} />
      )}

      {/* Three-pane layout */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" className="h-full">
          <Panel defaultSize={38} minSize={20} maxSize={60}>
            {isLoading ? (
              <div className="p-5 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i === 0 ? "w-3/4" : "w-full"}`} />
                ))}
              </div>
            ) : problem ? <ProblemDescription problem={problem} /> : null}
          </Panel>
          <Separator className="w-1 bg-zinc-800 hover:bg-emerald-600 transition-colors cursor-col-resize" />
          <Panel defaultSize={62} minSize={30}>
            <Group orientation="vertical" className="h-full">
              <Panel defaultSize={65} minSize={30}>
                <div className="h-full bg-zinc-950">
                  <CodeEditor value={code} onChange={handleCodeChange} language={language} />
                </div>
              </Panel>
              <Separator className="h-1 bg-zinc-800 hover:bg-emerald-600 transition-colors cursor-row-resize" />
              <Panel defaultSize={35} minSize={15} maxSize={70}>
                <ConsolePanel
                  sampleInput={sampleInput}
                  onRun={handleRun}
                  isRunning={isRunning}
                  result={runResult}
                />
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>
    </div>
  );
}

function SubmissionVerdictPanel({
  verdict, onDismiss,
}: { verdict: NonNullable<ReturnType<typeof useSubmission>["state"]["verdict"]>; onDismiss: () => void }) {
  const meta = VERDICT_META[verdict.verdict] ?? { color: "text-zinc-400", label: verdict.verdict, icon: null };
  const isAC = verdict.verdict === "ACCEPTED";

  return (
    <div className={`flex items-center gap-4 px-4 py-2 text-xs border-b border-zinc-800 ${isAC ? "bg-emerald-950/40" : "bg-zinc-900"}`}>
      <span className={`flex items-center gap-1.5 font-semibold ${meta.color}`}>
        {meta.icon}{meta.label}
      </span>
      {verdict.compileError && (
        <span className="text-amber-300 font-mono truncate max-w-md">{verdict.compileError}</span>
      )}
      {!verdict.compileError && (
        <>
          <span className="text-zinc-400">
            {verdict.testcasesPassed}/{verdict.totalTestcases} cases passed
          </span>
          {verdict.runtimeMs != null && (
            <span className="text-zinc-500">Runtime: {verdict.runtimeMs}ms</span>
          )}
        </>
      )}
      <button onClick={onDismiss} className="ml-auto text-zinc-600 hover:text-zinc-300 text-lg leading-none">×</button>
    </div>
  );
}
