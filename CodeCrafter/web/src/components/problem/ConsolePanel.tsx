"use client";

import { useState } from "react";
import { Loader2, Play, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RunResult } from "@/types/problems";

interface Props {
  sampleInput: string;
  onRun: (customInput?: string) => Promise<void>;
  isRunning: boolean;
  result: RunResult | null;
}

const VERDICT_COLOR: Record<string, string> = {
  ACCEPTED:           "text-emerald-400",
  WRONG_ANSWER:       "text-red-400",
  COMPILE_ERROR:      "text-amber-400",
  RUNTIME_ERROR:      "text-red-400",
  TIME_LIMIT_EXCEEDED:"text-amber-400",
  INTERNAL_ERROR:     "text-zinc-400",
};

export function ConsolePanel({ sampleInput, onRun, isRunning, result }: Props) {
  const [input, setInput] = useState(sampleInput);
  const [useCustom, setUseCustom] = useState(false);

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-t border-zinc-800">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 flex-shrink-0">
        <button
          onClick={() => setUseCustom(false)}
          className={`text-xs px-2 py-1 rounded ${!useCustom ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"}`}>
          Test Cases
        </button>
        <button
          onClick={() => setUseCustom(true)}
          className={`text-xs px-2 py-1 rounded ${useCustom ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"}`}>
          Custom Input
        </button>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => onRun(useCustom ? input : undefined)}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-500 h-7 text-xs gap-1">
            {isRunning
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Play className="h-3 w-3" />}
            Run
          </Button>
        </div>
      </div>

      {/* Input area */}
      {useCustom && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">Custom Input</p>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-200 p-2 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!result && !isRunning && (
          <p className="text-xs text-zinc-500">Run your code to see results here.</p>
        )}
        {isRunning && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <Loader2 className="h-4 w-4 animate-spin" />
            Executing…
          </div>
        )}
        {result && !isRunning && (
          <>
            {result.compileError && (
              <div>
                <p className="text-xs text-amber-400 font-semibold mb-1">Compile Error</p>
                <pre className="text-xs font-mono text-zinc-300 bg-zinc-900 p-3 rounded overflow-x-auto border border-zinc-800 whitespace-pre-wrap">
                  {result.compileError}
                </pre>
              </div>
            )}
            {result.results.map((r, i) => (
              <div key={i} className="border border-zinc-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-900">
                  <span className="text-xs text-zinc-400">Case {i + 1}</span>
                  <span className={`text-xs font-semibold ${VERDICT_COLOR[r.verdict] ?? "text-zinc-400"}`}>
                    {r.verdict.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <Row label="Input" value={r.input} />
                  {r.expectedOutput && <Row label="Expected" value={r.expectedOutput} />}
                  <Row label="Output" value={r.actualOutput || "(empty)"} />
                  {r.stderr && <Row label="Stderr" value={r.stderr} className="text-amber-300" />}
                  {r.runtimeMs != null && (
                    <p className="text-zinc-500">{r.runtimeMs}ms</p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <span className="text-zinc-500">{label}: </span>
      <span className={`text-zinc-200 whitespace-pre-wrap break-all ${className ?? ""}`}>{value}</span>
    </div>
  );
}
