import { motion } from 'framer-motion';
import { Monitor, Star, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { GenerationOutput } from '../../store/projectStore';

interface Props { data: GenerationOutput['landingPage']; }

export default function LandingPagePreview({ data }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Hero Section Preview */}
      <div className="glass p-8 text-center space-y-4 bg-gradient-to-br from-brand-900/20 to-violet-900/20">
        <div className="inline-flex items-center gap-2 text-xs text-brand-500 bg-brand-500/10 px-3 py-1 rounded-full">
          <Monitor size={12} /> Landing Page Preview
        </div>
        <h2 className="text-3xl font-bold text-white">{data.headline}</h2>
        <p className="text-xl text-slate-300">{data.subheadline}</p>
        <p className="text-slate-400 max-w-lg mx-auto">{data.heroDescription}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button className="btn-primary">{data.cta.primary}</button>
          <button className="btn-secondary">{data.cta.secondary}</button>
        </div>
      </div>

      {/* Features */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-3">✨ Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-4 flex gap-3"
            >
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-semibold text-slate-200">{f.title}</p>
                <p className="text-sm text-slate-400">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-3">💰 Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.pricing.map((p, i) => (
            <div key={i} className={`glass p-5 ${i === 1 ? 'border-brand-500/50 ring-1 ring-brand-500/30' : ''}`}>
              {i === 1 && <div className="text-xs text-brand-400 font-semibold mb-2">⭐ POPULAR</div>}
              <p className="font-bold text-xl text-white">{p.plan}</p>
              <p className="text-2xl font-bold text-brand-400 my-2">{p.price}</p>
              <ul className="space-y-1.5">
                {p.features.map((feat, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check size={14} className="text-brand-400 shrink-0" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-3">⭐ Testimonials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.testimonials.map((t, i) => (
            <div key={i} className="glass p-4">
              <div className="flex gap-0.5 mb-2">
                {[...Array(5)].map((_, s) => <Star key={s} size={12} className="text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-slate-300 text-sm italic mb-3">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-slate-200 text-sm">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-3">❓ FAQ</h3>
        <div className="space-y-2">
          {data.faq.map((f, i) => (
            <div key={i} className="glass overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex justify-between items-center p-4 text-left"
              >
                <span className="font-medium text-slate-200">{f.question}</span>
                {openFaq === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="px-4 pb-4 text-slate-400 text-sm"
                >
                  {f.answer}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

