import Link from 'next/link';
import { Sparkles, Layers, Zap, Download } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-6 w-6 text-blue-400" />
          AdCreative AI
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="text-center px-4 py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-sm px-3 py-1.5 rounded-full mb-6 border border-blue-500/30">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Ad Creative Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Create stunning ads{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            with AI
          </span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Generate AI backgrounds, write compelling copy, and export pixel-perfect static ad
          creatives — all in one platform. No design skills required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Start for free — 10 credits
          </Link>
          <Link
            href="/login"
            className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8 py-16 max-w-7xl mx-auto">
        {[
          {
            icon: <Sparkles className="h-6 w-6 text-blue-400" />,
            title: 'AI Background Generation',
            desc: 'Generate stunning backgrounds from text prompts using Stability AI',
          },
          {
            icon: <Layers className="h-6 w-6 text-purple-400" />,
            title: 'Layer-Based Editor',
            desc: 'Full canvas editor with drag, resize, rotate — text, image, and shape layers',
          },
          {
            icon: <Zap className="h-6 w-6 text-yellow-400" />,
            title: 'AI Copy Writing',
            desc: 'Generate headlines, CTAs, and body copy using GPT-4o in seconds',
          },
          {
            icon: <Download className="h-6 w-6 text-green-400" />,
            title: 'Export Static Images',
            desc: 'Export pixel-perfect PNG/JPG for any ad format — Facebook, Instagram, Google',
          },
        ].map((f, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
            <div className="mb-3">{f.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="px-8 py-16 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
        <p className="text-slate-400 mb-12">Start free, scale as you grow</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Free', price: '$0', credits: '10 credits/mo', features: ['10 AI generations', 'All ad formats', 'PNG export', 'Basic editor'] },
            { name: 'Pro', price: '$19', credits: '100 credits/mo', features: ['100 AI generations', 'Brand kit', 'Priority generation', 'All features'], highlight: true },
            { name: 'Business', price: '$49', credits: '500 credits/mo', features: ['500 AI generations', 'Unlimited brand kits', 'API access', 'Priority support'] },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border ${plan.highlight ? 'border-blue-500 bg-blue-600/20' : 'border-white/10 bg-white/5'}`}
            >
              <div className="text-lg font-semibold mb-1">{plan.name}</div>
              <div className="text-4xl font-bold mb-1">{plan.price}</div>
              <div className="text-slate-400 text-sm mb-6">{plan.credits}</div>
              <ul className="text-sm text-slate-300 space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'border border-white/20 hover:bg-white/10 text-white'
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 text-center py-8 text-slate-500 text-sm">
        © 2026 AdCreative AI. All rights reserved.
      </footer>
    </div>
  );
}

