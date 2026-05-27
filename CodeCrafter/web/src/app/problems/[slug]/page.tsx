"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Group, Panel, Separator } from "react-resizable-panels";
import { ChevronLeft, RotateCcw, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { ProblemDescription } from "@/components/problem/ProblemDescription";
import { ConsolePanel } from "@/components/problem/ConsolePanel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function ProblemPage() {
  const { slug } = useParams<{ slug: string }>();

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
  }, []);

  const handleReset = useCallback(() => {
    if (!problem) return;
    const starter = problem.starterCode[language] ?? "";
    setCode(starter);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`cc_code_${slug}_${language}`);
    }
  }, [problem, language, slug]);

  const handleRun = useCallback(async (customInput?: string) => {
    if (!problem) return;
    setIsRunning(true);
    setRunResult(null);
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
  }, [problem, slug, language, code]);

  const sampleInput = problem?.sampleTestCases?.[0]?.input ?? "";

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-zinc-100 gap-4">
        <p className="text-zinc-400">Problem not found.</p>
        <Link href="/problems" className="text-emerald-400 hover:underline text-sm">
          ← Back to Problems
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 h-11 border-b border-zinc-800 flex-shrink-0 bg-zinc-950 z-10">
        <Link
          href="/problems"
          className="flex items-center gap-1 text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Problems
        </Link>

        <div className="h-4 w-px bg-zinc-700 mx-1" />

        {isLoading ? (
          <Skeleton className="h-4 w-48" />
        ) : (
          <span className="text-sm font-medium truncate max-w-xs">
            {problem?.number}. {problem?.title}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-7 w-36 text-xs border-zinc-700 bg-zinc-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map(l => (
                <SelectItem key={l.value} value={l.value} className="text-xs">
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100"
            title="Reset to starter code"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            onClick={() => handleRun()}
            disabled={isRunning || isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 h-7 text-xs gap-1.5 px-3"
          >
            {isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Submit
          </Button>
        </div>
      </header>

      {/* Three-pane resizable layout */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" className="h-full">
          {/* Left: description */}
          <Panel defaultSize={38} minSize={20} maxSize={60}>
            {isLoading ? (
              <div className="p-5 space-y-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className={`h-4 ${i === 0 ? "w-3/4" : "w-full"}`} />
                ))}
              </div>
            ) : problem ? (
              <ProblemDescription problem={problem} />
            ) : null}
          </Panel>

          <Separator className="w-1 bg-zinc-800 hover:bg-emerald-600 transition-colors cursor-col-resize" />

          {/* Right: editor + console stacked */}
          <Panel defaultSize={62} minSize={30}>
            <Group orientation="vertical" className="h-full">
              <Panel defaultSize={65} minSize={30}>
                <div className="h-full bg-zinc-950">
                  <CodeEditor
                    value={code}
                    onChange={handleCodeChange}
                    language={language}
                  />
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
