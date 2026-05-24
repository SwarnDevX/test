import { Search, TrendingUp, FileText, Target } from 'lucide-react';
import type { GenerationOutput } from '../../store/projectStore';

interface Props { data: GenerationOutput['seoKeywords']; }

function KeywordBadge({ keyword, variant = 'default' }: { keyword: string; variant?: 'default' | 'long' | 'competitor' }) {
  const styles = {
    default: 'bg-brand-500/10 text-brand-300 border-brand-500/20',
    long: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    competitor: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${styles[variant]}`}>
      {keyword}
    </span>
  );
}

export default function SEOKeywordsPanel({ data }: Props) {
  return (
    <div className="space-y-5">
      {/* Meta */}
      <div className="glass p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Search size={16} className="text-brand-400" /> Meta Tags
        </div>
        <div className="bg-dark-900 rounded-xl p-4 space-y-2 font-mono text-sm">
          <div>
            <span className="text-slate-500">title: </span>
            <span className="text-green-400">{data.metaTitle}</span>
          </div>
          <div>
            <span className="text-slate-500">description: </span>
            <span className="text-blue-400">{data.metaDescription}</span>
          </div>
        </div>
      </div>

      {/* Primary Keywords */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
          <Target size={16} className="text-brand-400" /> Primary Keywords
        </div>
        <div className="flex flex-wrap gap-2">
          {data.primaryKeywords.map((k, i) => <KeywordBadge key={i} keyword={k} variant="default" />)}
        </div>
      </div>

      {/* Long-tail */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
          <TrendingUp size={16} className="text-violet-400" /> Long-Tail Keywords
        </div>
        <div className="flex flex-wrap gap-2">
          {data.longTailKeywords.map((k, i) => <KeywordBadge key={i} keyword={k} variant="long" />)}
        </div>
      </div>

      {/* Content Topics */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
          <FileText size={16} className="text-emerald-400" /> Blog / Content Topics
        </div>
        <ul className="space-y-2">
          {data.contentTopics.map((topic, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-emerald-400 font-bold mt-0.5">{i + 1}.</span> {topic}
            </li>
          ))}
        </ul>
      </div>

      {/* Competitor Keywords */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
          <span className="text-amber-400">⚔️</span> Competitor Keywords to Target
        </div>
        <div className="flex flex-wrap gap-2">
          {data.competitorKeywords.map((k, i) => <KeywordBadge key={i} keyword={k} variant="competitor" />)}
        </div>
      </div>
    </div>
  );
}

