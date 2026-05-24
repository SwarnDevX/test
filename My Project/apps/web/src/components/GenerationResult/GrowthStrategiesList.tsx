import { motion } from 'framer-motion';
import { Rocket, Star, Target, TrendingUp, Shield } from 'lucide-react';
import type { GenerationOutput } from '../../store/projectStore';

interface Props { data: GenerationOutput['growthStrategies']; }

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-500/10 text-red-300 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  low: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
};

export default function GrowthStrategiesList({ data }: Props) {
  return (
    <div className="space-y-5">
      {/* North Star Metric */}
      <div className="glass p-5 bg-gradient-to-r from-brand-900/20 to-violet-900/20 border-brand-500/30">
        <div className="flex items-center gap-2 mb-2 text-brand-400 font-semibold">
          <Star size={18} className="fill-brand-400" /> North Star Metric
        </div>
        <p className="text-2xl font-bold text-white">{data.northStarMetric}</p>
      </div>

      {/* Growth Channels */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">🚀 Growth Channels</h3>
        <div className="space-y-3">
          {data.channels.map((ch, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="font-semibold text-slate-200">{ch.name}</h4>
                  <p className="text-sm text-slate-400 mt-0.5">{ch.description}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full border font-semibold uppercase ${PRIORITY_STYLES[ch.priority]}`}>
                  {ch.priority}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-400 mb-3">
                <TrendingUp size={14} /> {ch.estimatedROI}
              </div>
              <ul className="space-y-1">
                {ch.actionItems.map((action, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" /> {action}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Week 1 Actions */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-3 font-semibold text-slate-300">
          <Rocket size={16} className="text-amber-400" /> Week 1 — Immediate Actions
        </div>
        <ul className="space-y-2">
          {data.week1Actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KPIs */}
        <div className="glass p-5">
          <div className="flex items-center gap-2 mb-3 font-semibold text-slate-300">
            <Target size={16} className="text-brand-400" /> KPIs to Track
          </div>
          <ul className="space-y-1.5">
            {data.kpis.map((k, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-brand-400">◆</span> {k}
              </li>
            ))}
          </ul>
        </div>

        {/* Retention */}
        <div className="glass p-5">
          <div className="flex items-center gap-2 mb-3 font-semibold text-slate-300">
            <Shield size={16} className="text-emerald-400" /> Retention Strategies
          </div>
          <ul className="space-y-1.5">
            {data.retentionStrategies.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-emerald-400">◆</span> {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Month 1 Goals */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-3 font-semibold text-slate-300">
          🗓️ Month 1 Goals
        </div>
        <ul className="space-y-2">
          {data.month1Goals.map((g, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-violet-400 font-bold shrink-0">✓</span> {g}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

