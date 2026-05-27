"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import type { ProblemDetail } from "@/types/problems";

const DIFFICULTY_VARIANT: Record<string, "easy" | "medium" | "hard"> = {
  EASY: "easy", MEDIUM: "medium", HARD: "hard",
};
const DIFFICULTY_LABELS: Record<string, string> = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

interface Props { problem: ProblemDetail }

export function ProblemDescription({ problem }: Props) {
  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-5 text-sm text-zinc-200">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-zinc-400 text-xs">{problem.number}.</span>
          <h1 className="text-lg font-semibold">{problem.title}</h1>
          <Badge variant={DIFFICULTY_VARIANT[problem.difficulty]}>
            {DIFFICULTY_LABELS[problem.difficulty]}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {problem.tags.map(t => (
            <Badge key={t} variant="tag" className="text-xs">{t}</Badge>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {problem.bodyMarkdown}
        </ReactMarkdown>
      </div>

      {/* Examples */}
      {problem.examples.length > 0 && (
        <div className="space-y-4">
          {problem.examples.map((ex, i) => (
            <div key={i}>
              <p className="font-medium text-zinc-300 mb-2">Example {i + 1}:</p>
              <div className="bg-zinc-900 rounded-lg p-3 space-y-1 font-mono text-xs border border-zinc-800">
                <div>
                  <span className="text-zinc-500">Input: </span>
                  <span className="text-zinc-200 whitespace-pre-wrap">{ex.input}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Output: </span>
                  <span className="text-zinc-200">{ex.output}</span>
                </div>
                {ex.explanation && (
                  <div className="pt-1 text-zinc-400">
                    <span className="text-zinc-500">Explanation: </span>
                    {ex.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Constraints */}
      {problem.constraintsMarkdown && (
        <div>
          <p className="font-medium text-zinc-300 mb-2">Constraints:</p>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {problem.constraintsMarkdown}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-800">
        <span>Acceptance: {Number(problem.acceptanceRate).toFixed(1)}%</span>
        <span>Time: {problem.timeLimitMs}ms</span>
        <span>Memory: {problem.memoryLimitMb}MB</span>
      </div>
    </div>
  );
}
