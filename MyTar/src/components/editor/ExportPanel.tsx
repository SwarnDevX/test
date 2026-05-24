'use client';

import { useState } from 'react';
import { Download, X, Loader2, CheckCircle } from 'lucide-react';
import Konva from 'konva';
import { useCanvasStore } from '@/store/canvasStore';
import { AD_FORMATS } from '@/types/canvas';

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
  stageRef: React.RefObject<Konva.Stage>;
  projectName: string;
  projectId: string;
}

type ExportFormat = 'png' | 'jpg';
type ExportQuality = 1 | 2 | 3;

export default function ExportPanel({ open, onClose, stageRef, projectName, projectId }: ExportPanelProps) {
  const { width, height } = useCanvasStore();
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>(2);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const qualityLabels: Record<ExportQuality, string> = {
    1: '1x — Standard (fastest)',
    2: '2x — High (recommended)',
    3: '3x — Ultra (largest file)',
  };

  const estimatedSize = Math.round((width * quality * height * quality * (format === 'png' ? 3 : 0.3)) / 1024);

  async function handleExport() {
    if (!stageRef.current) return;
    setExporting(true);
    setDone(false);

    const stage = stageRef.current;

    // Store original transform
    const origScale = { x: stage.scaleX(), y: stage.scaleY() };
    const origPos = { x: stage.x(), y: stage.y() };

    // Reset for export
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = stage.toDataURL({ pixelRatio: quality, mimeType });

    // Restore
    stage.scale(origScale);
    stage.position(origPos);

    // Download
    const link = document.createElement('a');
    link.download = `${projectName}-${width}x${height}@${quality}x.${format}`;
    link.href = dataUrl;
    link.click();

    setDone(true);
    setExporting(false);

    // Also save server-side export record
    fetch(`/api/projects/${projectId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format }),
    }).catch(() => {});

    setTimeout(() => setDone(false), 3000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-72 bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Download className="h-4 w-4 text-green-400" />
          Export
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Canvas info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-slate-400 mb-1">Canvas Size</div>
          <div className="text-lg font-bold">{width} × {height}px</div>
          <div className="text-xs text-slate-500 mt-1">
            {AD_FORMATS.find((f) => f.width === width && f.height === height)?.name ?? 'Custom format'}
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">File Format</label>
          <div className="grid grid-cols-2 gap-2">
            {(['png', 'jpg'] as ExportFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`py-3 rounded-lg border text-sm font-medium transition-colors ${
                  format === f
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                <div className="font-bold uppercase">{f}</div>
                <div className="text-xs opacity-70 mt-0.5">
                  {f === 'png' ? 'Lossless' : 'Compressed'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality / Scale */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Resolution Scale</label>
          <div className="space-y-1.5">
            {([1, 2, 3] as ExportQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-colors ${
                  quality === q
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                <span>{qualityLabels[q]}</span>
                <span className="text-slate-500">
                  {width * q}×{height * q}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Estimated size */}
        <div className="text-xs text-slate-500">
          Estimated file size: ~{estimatedSize > 1024 ? `${(estimatedSize / 1024).toFixed(1)} MB` : `${estimatedSize} KB`}
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
        >
          {done ? (
            <><CheckCircle className="h-4 w-4" /> Downloaded!</>
          ) : exporting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</>
          ) : (
            <><Download className="h-4 w-4" /> Export {format.toUpperCase()}</>
          )}
        </button>

        <p className="text-xs text-slate-500 text-center">
          Exports a static image — no animation or video.
        </p>
      </div>
    </div>
  );
}

