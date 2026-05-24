'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, X, Sparkles, Type, Layout, Image } from 'lucide-react';
import { useEditorStore, makeTextLayer } from '@/lib/store';
import { BackgroundLayer } from '@/lib/types';

const BG_STYLES = ['Photorealistic', 'Illustration', 'Gradient', 'Abstract', 'Minimal', '3D Render', 'Watercolor', 'Dark Luxury'];
const INDUSTRIES = ['Technology', 'Fashion', 'Food & Beverage', 'Health & Beauty', 'Finance', 'Real Estate', 'Education', 'Travel', 'E-commerce', 'Fitness'];
const TONES = ['Professional', 'Playful', 'Urgent', 'Luxurious', 'Friendly', 'Bold', 'Minimalist'];

type Tab = 'background' | 'copy' | 'layout';

interface Props { onClose: () => void; }

export default function AIPanel({ onClose }: Props) {
  const { layers, format, updateLayer, addLayer, setGenerating, isGenerating } = useEditorStore();
  const [tab, setTab] = useState<Tab>('background');

  // Background state
  const [bgPrompt, setBgPrompt] = useState('');
  const [bgStyle, setBgStyle] = useState('Photorealistic');

  // Copy state
  const [copyForm, setCopyForm] = useState({ productName: '', industry: 'Technology', tone: 'Professional', callToAction: 'Get Started' });

  // Layout state
  const [layouts, setLayouts] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [layoutsLoaded, setLayoutsLoaded] = useState(false);

  async function generateBackground() {
    if (!bgPrompt.trim()) { toast.error('Enter a prompt'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: bgPrompt, style: bgStyle.toLowerCase(), width: format.width, height: format.height }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Generation failed'); return; }

      const bgLayer = layers.find(l => l.type === 'background') as BackgroundLayer | undefined;
      if (bgLayer) {
        if (data.type === 'gradient') {
          updateLayer(bgLayer.id, { useGradient: true, gradientFrom: data.gradientFrom, gradientTo: data.gradientTo });
        } else {
          updateLayer(bgLayer.id, { imageUrl: data.value, useGradient: false });
        }
        toast.success('Background generated!');
      }
    } catch { toast.error('Generation error'); }
    finally { setGenerating(false); }
  }

  async function generateCopy() {
    if (!copyForm.productName.trim()) { toast.error('Enter product name'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyForm),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Generation failed'); return; }

      // Add generated text as layers
      const fmtW = format.width;
      addLayer(makeTextLayer({ content: data.headline, fontSize: 72, fontWeight: '800', x: 40, y: fmtW * 0.3, width: fmtW - 80, name: 'Headline' }));
      addLayer(makeTextLayer({ content: data.tagline, fontSize: 36, fontWeight: '400', color: 'rgba(255,255,255,0.8)', x: 40, y: fmtW * 0.5, width: fmtW - 80, name: 'Tagline' }));
      addLayer(makeTextLayer({ content: data.cta, fontSize: 28, fontWeight: '700', color: '#ffffff', x: fmtW / 2 - 120, y: fmtW * 0.7, width: 240, name: 'CTA' }));
      toast.success('Copy generated and added as layers!');
    } catch { toast.error('Generation error'); }
    finally { setGenerating(false); }
  }

  async function loadLayouts() {
    if (layoutsLoaded) return;
    const res = await fetch('/api/ai/generate-layout');
    const data = await res.json();
    setLayouts(data.layouts || []);
    setLayoutsLoaded(true);
  }

  const tabs: Array<{ id: Tab; label: string; icon: typeof Image }> = [
    { id: 'background', label: 'Background', icon: Image },
    { id: 'copy', label: 'Copy', icon: Type },
    { id: 'layout', label: 'Layout', icon: Layout },
  ];

  return (
    <div style={{ background: '#111128', borderRadius: '0 16px 16px 0', border: '1px solid #1e1e40', boxShadow: '4px 4px 24px rgba(0,0,0,0.6)', overflow: 'hidden', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #1e1e40', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#a78bfa" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0ff' }}>AI Generate</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }}><X size={16} /></button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e1e40' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); if (id === 'layout') loadLayouts(); }}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === id ? '#8b5cf6' : 'transparent'}`, color: tab === id ? '#a78bfa' : '#475569', cursor: 'pointer', fontSize: 13, fontWeight: tab === id ? 600 : 400, transition: 'all 0.15s' }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <div style={{ overflowY: 'auto', padding: 16 }}>
        {/* Background Tab */}
        {tab === 'background' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Describe your background</label>
              <textarea
                value={bgPrompt}
                onChange={e => setBgPrompt(e.target.value)}
                placeholder="A futuristic city at night with neon lights and purple haze..."
                rows={3}
                style={{ width: '100%', padding: '9px 10px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 8, color: '#f0f0ff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Style</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {BG_STYLES.map(s => (
                  <button key={s} onClick={() => setBgStyle(s)}
                    style={{ padding: '7px 8px', borderRadius: 7, border: `1px solid ${bgStyle === s ? '#8b5cf6' : '#1e1e40'}`, background: bgStyle === s ? 'rgba(139,92,246,0.12)' : '#0d0d24', color: bgStyle === s ? '#a78bfa' : '#94a3b8', cursor: 'pointer', fontSize: 12, textAlign: 'left', fontWeight: bgStyle === s ? 600 : 400 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b', marginBottom: 12 }}>
              ⚡ Costs 2 credits · Uses AI image generation
            </div>
            <button onClick={generateBackground} disabled={isGenerating}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, background: isGenerating ? '#2a2a55' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, boxShadow: isGenerating ? 'none' : '0 0 15px rgba(139,92,246,0.3)' }}>
              {isGenerating ? <><Loader2 size={16} className="animate-spin" />Generating...</> : <><Sparkles size={16} />Generate Background</>}
            </button>
          </div>
        )}

        {/* Copy Tab */}
        {tab === 'copy' && (
          <div>
            {[
              { key: 'productName', label: 'Product / Brand Name', placeholder: 'Nike Air Max' },
              { key: 'callToAction', label: 'Call to Action', placeholder: 'Shop Now' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{label}</label>
                <input value={copyForm[key as keyof typeof copyForm]} onChange={e => setCopyForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  style={{ width: '100%', padding: '9px 10px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 8, color: '#f0f0ff', fontSize: 13, outline: 'none' }}
                  onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Industry</label>
                <select value={copyForm.industry} onChange={e => setCopyForm(f => ({ ...f, industry: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 8, color: '#f0f0ff', fontSize: 12, outline: 'none' }}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Tone</label>
                <select value={copyForm.tone} onChange={e => setCopyForm(f => ({ ...f, tone: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 8, color: '#f0f0ff', fontSize: 12, outline: 'none' }}>
                  {TONES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: 12, color: '#f59e0b', marginBottom: 12 }}>
              ⚡ Costs 1 credit · Powered by Claude AI · Adds 3 text layers
            </div>
            <button onClick={generateCopy} disabled={isGenerating}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, background: isGenerating ? '#2a2a55' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700 }}>
              {isGenerating ? <><Loader2 size={16} className="animate-spin" />Generating...</> : <><Type size={16} />Generate Copy</>}
            </button>
          </div>
        )}

        {/* Layout Tab */}
        {tab === 'layout' && (
          <div>
            {!layoutsLoaded ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Loader2 size={20} className="animate-spin" color="#8b5cf6" /></div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14, lineHeight: 1.5 }}>Choose a layout template to automatically arrange your text layers:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {layouts.map(layout => (
                    <button key={layout.id}
                      style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #1e1e40', background: '#0d0d24', color: '#f0f0ff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e40'; e.currentTarget.style.background = '#0d0d24'; }}
                      onClick={() => toast.success(`${layout.name} layout applied`)}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{layout.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{layout.description}</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: '8px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.15)', fontSize: 12, color: '#10b981' }}>
                  ✓ Free — No credits required
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
