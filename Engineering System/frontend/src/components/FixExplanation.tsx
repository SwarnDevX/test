import { Wrench, Lightbulb } from "lucide-react";

interface Props {
  fix?: { patch: string; explanation: string; alternatives: string[] };
}

export default function FixExplanation({ fix }: Props) {
  if (!fix) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
      <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
        <Wrench size={16} /> Proposed Fix
      </h3>
      <p className="text-sm text-gray-300 leading-relaxed">{fix.explanation}</p>

      {fix.alternatives && fix.alternatives.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Lightbulb size={12} /> Alternative Approaches
          </p>
          <ul className="space-y-1">
            {fix.alternatives.map((alt, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                <span className="text-gray-600 mt-0.5">•</span>
                <span>{alt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Patch</p>
        <pre className="bg-gray-950 border border-gray-800 p-4 rounded-lg text-xs overflow-x-auto text-emerald-300 leading-relaxed">
          {fix.patch}
        </pre>
      </div>
    </div>
  );
}

