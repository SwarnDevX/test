import { useAISuggestions, useAnalytics } from '../../hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightbulb, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';

interface Props { projectId: string; }

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  warning: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
  success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
  info: <Info size={16} className="text-brand-400 shrink-0" />,
};
const INSIGHT_STYLES: Record<string, string> = {
  warning: 'border-amber-500/20 bg-amber-500/5',
  success: 'border-emerald-500/20 bg-emerald-500/5',
  info: 'border-brand-500/20 bg-brand-500/5',
};
const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-500/20 text-red-300',
  medium: 'bg-amber-500/20 text-amber-300',
  low: 'bg-slate-500/20 text-slate-300',
};

export default function AISuggestionsPanel({ projectId }: Props) {
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(projectId);
  const { data: suggestions, isLoading: suggestionsLoading } = useAISuggestions(projectId);

  const chartData = analytics?.eventBreakdown
    ? Object.entries(analytics.eventBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="glass p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          📊 Analytics Overview
        </h3>
        {analyticsLoading ? (
          <div className="text-slate-500 text-sm">Loading analytics...</div>
        ) : analytics ? (
          <>
            <div className="flex gap-4 mb-4">
              <div className="glass p-4 flex-1 text-center">
                <p className="text-3xl font-bold text-brand-400">{analytics.totalEvents}</p>
                <p className="text-sm text-slate-400 mt-1">Total Events</p>
              </div>
              <div className="glass p-4 flex-1 text-center">
                <p className="text-3xl font-bold text-violet-400">{Object.keys(analytics.eventBreakdown || {}).length}</p>
                <p className="text-sm text-slate-400 mt-1">Event Types</p>
              </div>
            </div>
            {chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        ) : (
          <p className="text-slate-500 text-sm">No analytics data yet. Interact with your landing page to see insights.</p>
        )}
      </div>

      {/* AI Suggestions */}
      <div className="glass p-5">
        <h3 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Zap size={18} className="text-brand-400" /> AI-Powered Improvement Suggestions
        </h3>
        {suggestionsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : suggestions ? (
          <div className="space-y-5">
            {/* Score */}
            {suggestions.overallScore !== undefined && (
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0ea5e9" strokeWidth="3"
                      strokeDasharray={`${suggestions.overallScore} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                    {suggestions.overallScore}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-200">Growth Score</p>
                  <p className="text-sm text-slate-400">Based on current analytics</p>
                </div>
              </div>
            )}

            {/* Insights */}
            {suggestions.insights?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><Lightbulb size={14} /> Insights</p>
                <div className="space-y-2">
                  {suggestions.insights.map((ins: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${INSIGHT_STYLES[ins.type] || INSIGHT_STYLES.info}`}>
                      {INSIGHT_ICONS[ins.type] || INSIGHT_ICONS.info}
                      <div>
                        <p className="font-medium text-slate-200 text-sm">{ins.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{ins.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {suggestions.improvements?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-2">🔧 Improvement Actions</p>
                <div className="space-y-2">
                  {suggestions.improvements.map((imp: any, i: number) => (
                    <div key={i} className="glass p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_BADGE[imp.priority] || PRIORITY_BADGE.medium}`}>
                          {imp.priority}
                        </span>
                        <span className="text-xs text-slate-500">{imp.area}</span>
                      </div>
                      <p className="text-sm text-slate-200">{imp.suggestion}</p>
                      <p className="text-xs text-emerald-400 mt-1">📈 {imp.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* A/B Tests */}
            {suggestions.abTestIdeas?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-2">🧪 A/B Test Ideas</p>
                <ul className="space-y-1.5">
                  {suggestions.abTestIdeas.map((idea: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-violet-400 font-bold shrink-0">→</span> {idea}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">AI suggestions will appear after analytics data is collected.</p>
        )}
      </div>
    </div>
  );
}

