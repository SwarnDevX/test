import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Megaphone, Search, Rocket, BarChart2, Download, RefreshCw } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { useTrackEvent } from '../../hooks/useAnalytics';
import LandingPagePreview from './LandingPagePreview';
import MarketingCopyCard from './MarketingCopyCard';
import SEOKeywordsPanel from './SEOKeywordsPanel';
import GrowthStrategiesList from './GrowthStrategiesList';
import AISuggestionsPanel from '../Analytics/AISuggestionsPanel';

const TABS = [
  { id: 'landing', label: 'Landing Page', icon: Monitor },
  { id: 'marketing', label: 'Marketing Copy', icon: Megaphone },
  { id: 'seo', label: 'SEO Keywords', icon: Search },
  { id: 'growth', label: 'Growth Plan', icon: Rocket },
  { id: 'analytics', label: 'Analytics & AI', icon: BarChart2 },
];

export default function GenerationResult() {
  const { output, currentProjectId, currentIdea, clear } = useProjectStore();
  const [activeTab, setActiveTab] = useState('landing');
  const track = useTrackEvent();

  useEffect(() => {
    if (currentProjectId) {
      track(currentProjectId, 'view_result', { tab: activeTab });
    }
  }, [activeTab, currentProjectId]);

  if (!output) return null;

  const handleDownload = () => {
    const json = JSON.stringify({ idea: currentIdea, output }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growth-engine-${currentProjectId?.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (currentProjectId) track(currentProjectId, 'download_json');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">🚀 Your Growth Engine is Ready</h2>
          <p className="text-slate-400 text-sm line-clamp-1 max-w-xl">"{currentIdea}"</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleDownload} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> Export JSON
          </button>
          <button onClick={clear} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> New Idea
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass p-1 mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
              activeTab === id
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'landing' && <LandingPagePreview data={output.landingPage} />}
          {activeTab === 'marketing' && <MarketingCopyCard data={output.marketingCopy} />}
          {activeTab === 'seo' && <SEOKeywordsPanel data={output.seoKeywords} />}
          {activeTab === 'growth' && <GrowthStrategiesList data={output.growthStrategies} />}
          {activeTab === 'analytics' && currentProjectId && (
            <AISuggestionsPanel projectId={currentProjectId} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

