import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lightbulb, ArrowRight } from 'lucide-react';
import { useGenerate } from '../../hooks/useGenerate';

const EXAMPLE_IDEAS = [
  'AI-powered code review tool for GitHub PRs',
  'No-code app builder for restaurant owners',
  'Subscription tracker with smart savings suggestions',
  'Automated LinkedIn content creator for executives',
];

export default function IdeaForm() {
  const [idea, setIdea] = useState('');
  const [projectName, setProjectName] = useState('');
  const { mutate: generate, isPending } = useGenerate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length < 10) return;
    generate({ idea: idea.trim(), projectName: projectName.trim() || undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Hero Text */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 text-brand-500 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
        >
          <Sparkles size={14} /> AI-Powered Growth Engine
        </motion.div>
        <h1 className="text-5xl font-bold bg-gradient-to-br from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-4 leading-tight">
          Turn Your Idea Into a
          <br />
          <span className="bg-gradient-to-r from-brand-500 to-violet-400 bg-clip-text text-transparent">
            Launch-Ready Startup
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Describe your startup idea and get a complete landing page, marketing copy, SEO strategy, and growth plan — powered by AI.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Your Startup Idea *</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. An AI assistant that automatically categorizes and responds to customer support emails, reducing response time by 90%..."
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 resize-none transition-all"
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-500">Min 10 characters</span>
            <span className={`text-xs ${idea.length > 450 ? 'text-amber-400' : 'text-slate-500'}`}>
              {idea.length}/500
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Project Name (optional)</label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My Startup"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || idea.trim().length < 10}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
        >
          {isPending ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              Generating your growth engine...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Growth Engine
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Example ideas */}
      <div className="mt-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Lightbulb size={14} /> Try an example:
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_IDEAS.map((ex) => (
            <button
              key={ex}
              onClick={() => setIdea(ex)}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

