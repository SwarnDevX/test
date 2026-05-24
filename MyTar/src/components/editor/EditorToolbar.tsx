'use client';

import { useState, useEffect } from 'react';
import { useCanvasStore, createTextLayer, createImageLayer } from '@/store/canvasStore';
import { Sparkles, Type, Square, Undo2, Redo2, Download, Save, ChevronLeft, Loader2, X, Palette } from 'lucide-react';
import ImageUploader from '@/components/editor/ImageUploader';
import { cn } from '@/lib/utils';
import { STYLE_PRESETS } from '@/lib/stylePresets';
import { GOOGLE_FONTS, loadGoogleFont, preloadEditorFonts } from '@/lib/fonts';
import NextImage from 'next/image';

interface AiPanelProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

function AiPanel({ projectId, open, onClose }: AiPanelProps) {
  const [tab, setTab] = useState<'background' | 'copy' | 'layout'>('background');
  const [prompt, setPrompt] = useState('');
  const [stylePreset, setStylePreset] = useState('none');
  const [copyData, setCopyData] = useState({ productName: '', description: '', tone: 'professional', targetAudience: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const { addLayer, width, height } = useCanvasStore();

  async function generateBackground() {
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/ai/background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, width, height, projectId, style: stylePreset }),
    });
    const data = await res.json();
    if (res.ok) {
      setJobId(data.jobId);
      pollStatus(data.assetId);
    } else {
      alert(data.error || 'Generation failed');
    }
    setLoading(false);
  }

  async function pollStatus(assetId: string) {
    setPolling(true);
    const interval = setInterval(async () => {
      const res = await fetch(`/api/ai/status/${assetId}`);
      const data = await res.json();
      if (data.status === 'DONE') {
        setResult(data);
        setPolling(false);
        clearInterval(interval);
      } else if (data.status === 'FAILED') {
        alert('Generation failed. Credits have been refunded.');
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);
    setTimeout(() => clearInterval(interval), 120000); // 2 min timeout
  }

  async function generateCopy() {
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/ai/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...copyData, variants: 3 }),
    });
    const data = await res.json();
    if (res.ok) setResult(data);
    else alert(data.error || 'Generation failed');
    setLoading(false);
  }

  function applyBackground(url: string) {
    addLayer({
      type: 'background',
      name: 'AI Background',
      x: 0, y: 0,
      width, height,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      imageUrl: url,
    } as any);
    onClose();
  }

  function applyCopy(variant: any) {
    addLayer(createTextLayer({ text: variant.headline, fontSize: 48, y: 80, color: '#FFFFFF', fontWeight: '700' }));
    if (variant.subheadline) {
      addLayer(createTextLayer({ text: variant.subheadline, fontSize: 24, y: 150, color: '#E2E8F0' }));
    }
    if (variant.cta) {
      addLayer(createTextLayer({ text: variant.cta, fontSize: 20, y: 230, color: '#FFFFFF', fontWeight: '600' }));
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Sparkles className="h-4 w-4 text-blue-400" />
          AI Generator
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['background', 'copy', 'layout'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setResult(null); }}
            className={cn('flex-1 py-2.5 text-xs font-medium transition-colors',
              tab === t ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'
            )}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === 'background' && (
          <>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Describe the background</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="A vibrant abstract gradient with blue and purple tones, modern and professional..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Style Presets */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Style Preset</label>
              <div className="grid grid-cols-2 gap-1.5">
                {STYLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setStylePreset(preset.id)}
                    className={cn(
                      'px-2 py-2 rounded-lg border text-xs text-left transition-colors',
                      stylePreset === preset.id
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-white/10 text-slate-400 hover:bg-white/5'
                    )}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500">Costs 3 credits per generation</div>
            <button
              onClick={generateBackground}
              disabled={loading || polling || !prompt.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              {(loading || polling) && <Loader2 className="h-4 w-4 animate-spin" />}
              {polling ? 'Generating...' : loading ? 'Queuing...' : 'Generate Background'}
            </button>

            {result?.resultUrl && (
              <div>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-2">
                  <NextImage src={result.resultUrl} alt="AI generated background" fill className="object-cover" />
                </div>
                <button
                  onClick={() => applyBackground(result.resultUrl)}
                  className="w-full bg-green-600 hover:bg-green-500 text-sm font-medium py-2 rounded-lg"
                >
                  Apply to Canvas
                </button>
              </div>
            )}
          </>
        )}

        {tab === 'copy' && (
          <>
            {[
              { key: 'productName', label: 'Product / Brand Name', placeholder: 'Nike Air Max' },
              { key: 'description', label: 'Description', placeholder: 'Premium running shoes with air cushioning' },
              { key: 'targetAudience', label: 'Target Audience', placeholder: 'Athletes aged 18-35' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                <input
                  value={(copyData as any)[key]}
                  onChange={(e) => setCopyData({ ...copyData, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Tone</label>
              <select
                value={copyData.tone}
                onChange={(e) => setCopyData({ ...copyData, tone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none"
              >
                {['professional', 'casual', 'exciting', 'luxury', 'urgent', 'friendly'].map((t) => (
                  <option key={t} value={t} className="bg-slate-800">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">Costs 1 credit per generation</div>
            <button
              onClick={generateCopy}
              disabled={loading || !copyData.productName}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Generating...' : 'Generate Copy'}
            </button>

            {result?.variants && (
              <div className="space-y-3">
                <div className="text-xs text-slate-400 font-medium">Choose a variant:</div>
                {result.variants.map((v: any, i: number) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="font-semibold text-sm mb-1">{v.headline}</div>
                    {v.subheadline && <div className="text-xs text-slate-400 mb-2">{v.subheadline}</div>}
                    {v.cta && <div className="text-xs text-blue-400">CTA: {v.cta}</div>}
                    <button
                      onClick={() => applyCopy(v)}
                      className="mt-2 w-full bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs py-1.5 rounded border border-green-600/30"
                    >
                      Apply to Canvas
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'layout' && (
          <div className="text-center text-slate-500 text-xs py-8">
            Layout suggestions coming soon. Set up your canvas format and brand kit first.
          </div>
        )}
      </div>
    </div>
  );
}

interface EditorToolbarProps {
  projectId: string;
  projectName: string;
  onSave: () => Promise<void>;
  onExport: () => Promise<void>;
  saving: boolean;
  exporting: boolean;
}

export default function EditorToolbar({ projectId, projectName, onSave, onExport, saving, exporting, onBrandPanel, onExportPanel }: EditorToolbarProps & { onBrandPanel: () => void; onExportPanel: () => void }) {
  const { addLayer, undo, redo, past, future, width, height } = useCanvasStore();
  const [aiOpen, setAiOpen] = useState(false);

  // Preload Google Fonts
  useEffect(() => {
    preloadEditorFonts();
  }, []);

  function addText() {
    addLayer(createTextLayer());
  }

  function addShape() {
    addLayer({
      type: 'shape',
      name: 'Rectangle',
      x: 100, y: 100,
      width: 200, height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      shapeType: 'rect',
      fill: '#3B82F6',
      stroke: 'transparent',
      strokeWidth: 0,
      cornerRadius: 8,
    } as any);
  }

  return (
    <>
      <div className="h-12 bg-slate-900 border-b border-white/10 flex items-center px-4 gap-2 flex-shrink-0">
        {/* Back */}
        <a href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mr-2">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline truncate max-w-32">{projectName}</span>
        </a>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Add layers */}
        <button onClick={addText} className="flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded text-xs transition-colors" title="Add Text">
          <Type className="h-4 w-4" /> <span className="hidden md:inline">Text</span>
        </button>
        <ImageUploader
          label="Image"
          className="flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer"
        />
        <button onClick={addShape} className="flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded text-xs transition-colors" title="Add Shape">
          <Square className="h-4 w-4" /> <span className="hidden md:inline">Shape</span>
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* History */}
        <button onClick={undo} disabled={past.length === 0} className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/10 rounded" title="Undo (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </button>
        <button onClick={redo} disabled={future.length === 0} className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-white/10 rounded" title="Redo (Ctrl+Y)">
          <Redo2 className="h-4 w-4" />
        </button>

        {/* Canvas size badge */}
        <div className="hidden md:flex text-xs text-slate-500 px-2">{width}×{height}</div>

        <div className="flex-1" />

        {/* Brand Kit */}
        <button
          onClick={onBrandPanel}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded text-xs transition-colors"
          title="Brand Kit"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden md:inline">Brand</span>
        </button>

        {/* AI */}
        <button
          onClick={() => setAiOpen(true)}
          className="flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-600/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Generate
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-2.5 py-1.5 rounded text-xs transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
        </button>

        {/* Export */}
        <button
          onClick={onExportPanel}
          disabled={exporting}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
        </button>
      </div>

      <AiPanel projectId={projectId} open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}
