import { motion } from 'framer-motion';
import IdeaForm from '../components/IdeaForm/IdeaForm';
import GenerationResult from '../components/GenerationResult/GenerationResult';
import { useProjectStore } from '../store/projectStore';

export default function HomePage() {
  const { output, isGenerating } = useProjectStore();

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-4 py-12">
        {/* Navbar */}
        <nav className="max-w-5xl mx-auto flex items-center justify-between mb-16">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <span className="text-2xl">🚀</span>
            <span>Growth<span className="text-brand-500">Engine</span></span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">Docs</a>
            <a href="#" className="btn-secondary text-sm py-2 px-4">Sign In</a>
          </div>
        </nav>

        {/* Main content */}
        <div className="max-w-5xl mx-auto">
          {isGenerating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🧠</div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">AI is crafting your growth engine...</h2>
              <div className="space-y-2 text-slate-400 text-sm">
                {['Analyzing your startup idea', 'Generating landing page structure', 'Writing marketing copy', 'Researching SEO keywords', 'Building growth strategy'].map((step, i) => (
                  <motion.p
                    key={step}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.8 }}
                    className="flex items-center gap-2 justify-center"
                  >
                    <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" /> {step}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          ) : output ? (
            <GenerationResult />
          ) : (
            <IdeaForm />
          )}
        </div>

        {/* Footer */}
        {!output && !isGenerating && (
          <div className="mt-20 text-center">
            <p className="text-slate-600 text-sm">
              Powered by GPT-4o · Redis Cache · PostgreSQL · Built with ❤️ using React + Node.js
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

