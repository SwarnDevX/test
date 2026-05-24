'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useCanvasStore } from '@/store/canvasStore';
import { Palette, Upload, X, ChevronDown, ChevronUp } from 'lucide-react';
import ImageUploader from './ImageUploader';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface BrandPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function BrandPanel({ open, onClose }: BrandPanelProps) {
  const { data } = useSWR('/api/brand-kits', fetcher);
  const brandKits = data?.brandKits ?? [];
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const { layers, updateLayer, selectedId, getSelectedLayer, addLayer } = useCanvasStore();

  const selectedKit = brandKits.find((k: any) => k.id === selectedKitId);
  const selectedLayer = getSelectedLayer();

  function applyColor(color: string) {
    if (selectedLayer?.type === 'text') {
      updateLayer(selectedLayer.id, { color } as any);
    }
  }

  function applyFont(font: string) {
    if (selectedLayer?.type === 'text') {
      updateLayer(selectedLayer.id, { fontFamily: font } as any);
    }
  }

  function applyLogoToCanvas(url: string) {
    addLayer({
      type: 'image',
      name: 'Brand Logo',
      x: 40,
      y: 40,
      width: 180,
      height: 80,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      imageUrl: url,
      isLogo: true,
      fit: 'contain',
    } as any);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-72 bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Palette className="h-4 w-4 text-purple-400" />
          Brand Panel
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Kit selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Select Brand Kit</label>
          <select
            value={selectedKitId ?? ''}
            onChange={(e) => setSelectedKitId(e.target.value || null)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="" className="bg-slate-800">— No kit selected —</option>
            {brandKits.map((kit: any) => (
              <option key={kit.id} value={kit.id} className="bg-slate-800">{kit.name}</option>
            ))}
          </select>
          {brandKits.length === 0 && (
            <p className="text-xs text-slate-500 mt-2">
              No brand kits yet.{' '}
              <a href="/brand-kits" className="text-purple-400 hover:underline">Create one</a>
            </p>
          )}
        </div>

        {selectedKit && (
          <>
            {/* Brand Colors */}
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-xs font-medium text-slate-300 mb-2"
              >
                <span>Brand Colors</span>
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {expanded && (
                <>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(selectedKit.colors as string[]).map((color: string) => (
                      <button
                        key={color}
                        onClick={() => applyColor(color)}
                        title={`Apply ${color} to selected text layer`}
                        className={cn(
                          'w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110',
                          selectedLayer?.type === 'text'
                            ? 'border-white/30 cursor-pointer'
                            : 'border-white/10 cursor-not-allowed opacity-50'
                        )}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                  {selectedLayer?.type !== 'text' && (
                    <p className="text-xs text-slate-500">Select a text layer to apply colors</p>
                  )}
                </>
              )}
            </div>

            {/* Brand Fonts */}
            {selectedKit.fonts && Object.keys(selectedKit.fonts).length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-300 mb-2">Brand Fonts</div>
                <div className="space-y-1.5">
                  {Object.entries(selectedKit.fonts as Record<string, string>).map(([role, font]) => (
                    <button
                      key={role}
                      onClick={() => applyFont(font)}
                      disabled={selectedLayer?.type !== 'text'}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                    >
                      <span className="text-slate-400 capitalize">{role}</span>
                      <span style={{ fontFamily: font }}>{font}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Logo */}
            <div>
              <div className="text-xs font-medium text-slate-300 mb-2">Brand Logo</div>
              {selectedKit.logoUrl ? (
                <div className="space-y-2">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-center h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedKit.logoUrl} alt="Brand logo" className="max-h-full max-w-full object-contain" />
                  </div>
                  <button
                    onClick={() => applyLogoToCanvas(selectedKit.logoUrl)}
                    className="w-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-600/30 text-xs py-2 rounded-lg"
                  >
                    Add Logo to Canvas
                  </button>
                </div>
              ) : (
                <ImageUploader
                  type="logo"
                  label="Upload Brand Logo"
                  className="flex items-center justify-center gap-2 w-full border border-dashed border-white/20 hover:border-purple-500/50 text-slate-400 hover:text-purple-400 text-xs py-3 rounded-lg cursor-pointer transition-colors"
                  onUploaded={async (url) => {
                    await fetch(`/api/brand-kits/${selectedKit.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ logoUrl: url }),
                    });
                    applyLogoToCanvas(url);
                  }}
                />
              )}
            </div>
          </>
        )}

        {/* Quick logo upload (no kit) */}
        {!selectedKit && (
          <div>
            <div className="text-xs font-medium text-slate-300 mb-2">Upload Logo</div>
            <ImageUploader
              type="logo"
              label="Upload & Add to Canvas"
              className="flex items-center justify-center gap-2 w-full border border-dashed border-white/20 hover:border-purple-500/50 text-slate-400 hover:text-purple-400 text-xs py-4 rounded-lg cursor-pointer transition-colors"
              onUploaded={applyLogoToCanvas}
            />
          </div>
        )}
      </div>
    </div>
  );
}

