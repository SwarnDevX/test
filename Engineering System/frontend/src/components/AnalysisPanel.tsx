import ConfidenceBadge from "./ConfidenceBadge";
import { Brain } from "lucide-react";

interface Props {
  analysis?: { rootCause: string; explanation: string; confidenceScore: number };
}

export default function AnalysisPanel({ analysis }: Props) {
  if (!analysis) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center text-gray-500">
        <Brain size={32} className="mx-auto mb-2 opacity-40" />
        <p>Awaiting AI analysis...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <Brain size={16} /> AI Root Cause Analysis
        </h3>
        <ConfidenceBadge score={analysis.confidenceScore} />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Root Cause</p>
        <p className="text-sm font-medium text-white">{analysis.rootCause}</p>
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Explanation</p>
        <p className="text-sm text-gray-300 leading-relaxed">{analysis.explanation}</p>
      </div>
    </div>
  );
}

