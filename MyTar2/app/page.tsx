'use client';
import Link from 'next/link';
import { Zap, Layers, Type, Download, Cpu, Palette, ArrowRight, Check, Play } from 'lucide-react';

const features = [
  { icon: Cpu, title: 'AI Background Generation', desc: 'Describe your vision and AI instantly creates stunning backgrounds for your ads.' },
  { icon: Type, title: 'AI Copywriting', desc: 'Generate compelling headlines, taglines, and CTAs tailored to your brand voice.' },
  { icon: Layers, title: 'Full Layer Control', desc: 'Drag, resize, rotate, and arrange every element with pixel-perfect precision.' },
  { icon: Palette, title: 'Brand Kits', desc: 'Save your colors, fonts, and logos — apply them instantly across all projects.' },
  { icon: Zap, title: '13+ Ad Formats', desc: 'Square, story, banner, social — every major ad format ready in one click.' },
  { icon: Download, title: 'Instant Export', desc: 'Export crisp PNG or JPG at 1x, 2x, or 3x resolution, ready for any platform.' },
];

const plans = [
  { name: 'Free', price: 0, credits: 10, features: ['10 credits/month', '5 projects', 'All ad formats', 'PNG export'], cta: 'Start Free', highlight: false },
  { name: 'Starter', price: 9.99, credits: 100, features: ['100 credits/month', 'Unlimited projects', 'All ad formats', 'PNG & JPG export', 'Brand kits'], cta: 'Get Starter', highlight: false },
  { name: 'Pro', price: 29.99, credits: 500, features: ['500 credits/month', 'Unlimited projects', 'Priority AI generation', 'Custom fonts', '2x export resolution', 'Brand kits'], cta: 'Go Pro', highlight: true },
  { name: 'Business', price: 99.99, credits: 2000, features: ['2000 credits/month', 'Team collaboration', 'API access', 'Priority support', '3x export resolution', 'White-label'], cta: 'Contact Sales', highlight: false },
];

export default function LandingPage() {
  return (
    <div style={{ background: '#07071a', minHeight: '100vh', color: '#f0f0ff' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1e1e40', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(7,7,26,0.85)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>AdCreative<span style={{ color: '#8b5cf6' }}>AI</span></span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/login" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #1e1e40', color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Sign In</Link>
            <Link href="/register" style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, border: '1px solid #2a2a55', background: 'rgba(139,92,246,0.1)', fontSize: 13, color: '#a78bfa', marginBottom: 32 }}>
          <Zap size={13} /> AI-Powered Ad Creative Platform
        </div>
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}>
          Design Stunning Ads<br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            in Seconds with AI
          </span>
        </h1>
        <p style={{ fontSize: 20, color: '#94a3b8', maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.6 }}>
          AI generates your backgrounds and copy. You customize every layer. Export pixel-perfect static ads for any platform.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: 'white', textDecoration: 'none', fontSize: 16, fontWeight: 700, boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}>
            Start Creating Free <ArrowRight size={18} />
          </Link>
          <a href="#features" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, border: '1px solid #2a2a55', color: '#94a3b8', textDecoration: 'none', fontSize: 16, fontWeight: 500 }}>
            <Play size={16} /> See How It Works
          </a>
        </div>

        {/* Hero Preview */}
        <div style={{ marginTop: 72, position: 'relative' }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.15) 0%, transparent 100%)', borderRadius: 24, border: '1px solid #1e1e40', overflow: 'hidden', padding: 3 }}>
            <div style={{ background: '#0d0d24', borderRadius: 22, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div style={{ position: 'relative', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                {/* Sidebar mock */}
                <div style={{ width: 200, background: '#111128', borderRadius: 12, border: '1px solid #1e1e40', padding: 16, height: 320 }}>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Layers</div>
                  {['Background', 'Headline', 'Tagline', 'Logo', 'CTA Button'].map((l, i) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, background: i === 1 ? 'rgba(139,92,246,0.15)' : 'transparent', border: i === 1 ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent', marginBottom: 4, fontSize: 13, color: i === 1 ? '#a78bfa' : '#94a3b8', cursor: 'pointer' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: i === 1 ? '#8b5cf6' : '#475569' }} />
                      {l}
                    </div>
                  ))}
                </div>
                {/* Canvas mock */}
                <div style={{ width: 260, height: 260, borderRadius: 12, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '2px solid rgba(139,92,246,0.4)' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'white', textAlign: 'center', letterSpacing: '-0.02em' }}>Your Brand<br />Reimagined</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>The future is here today</div>
                  <div style={{ marginTop: 8, padding: '8px 20px', background: 'white', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#764ba2' }}>Get Started</div>
                </div>
                {/* Props panel mock */}
                <div style={{ width: 180, background: '#111128', borderRadius: 12, border: '1px solid #1e1e40', padding: 16, height: 320 }}>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Text Style</div>
                  {['Font Family', 'Font Size', 'Color', 'Alignment', 'Shadow'].map(p => (
                    <div key={p} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{p}</div>
                      <div style={{ height: 28, background: '#0d0d24', borderRadius: 6, border: '1px solid #1e1e40' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div style={{ borderTop: '1px solid #1e1e40', borderBottom: '1px solid #1e1e40' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32 }}>
          {[['10,000+', 'Ads Created'], ['13+', 'Ad Formats'], ['3', 'AI Models'], ['< 5s', 'Generation Time']].map(([val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
              <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 16 }}>Everything You Need</h2>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 500, margin: '0 auto' }}>A complete toolkit for creating professional ad creatives without design experience.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: '#111128', borderRadius: 16, border: '1px solid #1e1e40', padding: 28, transition: 'border-color 0.2s', cursor: 'default' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#8b5cf6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e1e40')}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={22} color="#a78bfa" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 120px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 16 }}>Simple Pricing</h2>
          <p style={{ fontSize: 18, color: '#94a3b8' }}>Pay only for what you generate. No hidden fees.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {plans.map(plan => (
            <div key={plan.name} style={{ background: plan.highlight ? 'linear-gradient(180deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.06) 100%)' : '#111128', borderRadius: 20, border: `1px solid ${plan.highlight ? '#8b5cf6' : '#1e1e40'}`, padding: 28, position: 'relative', boxShadow: plan.highlight ? '0 0 40px rgba(139,92,246,0.2)' : 'none' }}>
              {plan.highlight && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', padding: '4px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>Most Popular</div>}
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 900 }}>${plan.price}</span>
                <span style={{ fontSize: 14, color: '#94a3b8' }}>/mo</span>
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>{plan.credits} credits/month</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#94a3b8' }}>
                    <Check size={15} color="#10b981" style={{ flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 10, background: plan.highlight ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'transparent', border: plan.highlight ? 'none' : '1px solid #2a2a55', color: plan.highlight ? 'white' : '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e1e40', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={13} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>AdCreative<span style={{ color: '#8b5cf6' }}>AI</span></span>
        </div>
        <p style={{ fontSize: 13, color: '#475569' }}>© 2025 AdCreativeAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
