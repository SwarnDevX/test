export default function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
    score >= 50 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
    "bg-red-500/20 text-red-400 border-red-500/30";

  return (
    <span className={`${color} border text-xs font-bold px-2.5 py-0.5 rounded-full`}>
      {score}%
    </span>
  );
}

