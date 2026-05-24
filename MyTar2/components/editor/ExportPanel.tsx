'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, X, Image, FileImage } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { downloadDataUrl } from '@/lib/utils';

export default function ExportPanel() {
  const { setActivePanel, format } = useEditorStore();
  const [exportFormat, setExportFormat] = useState<'png' | 'jpg'>('png');
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(2);

  async function handleExport() {
    const event = new CustomEvent('editor:export', { detail: { format: exportFormat, quality, scale } });
    window.dispatchEvent(event);
    toast.success(`Exporting as ${exportFormat.toUpperCase()} @ ${scale}x...`);
  }

  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e40', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={14} color="#8b5cf6" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff' }}>Export</span>
        </div>
        <button onClick={() => setActivePanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={16} /></button>
      </div>

      <div style={{ padding: 16 }}>
        {/* Canvas Info */}
        <div style={{ padding: '12px 14px', background: 'rgba(139,92,246,0.08)', borderRadius: 10, border: '1px solid rgba(139,92,246,0.15)', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Canvas Size</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>{format.width} × {format.height}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{format.name}</div>
        </div>

        {/* Format */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>File Format</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([['png', 'PNG', 'Lossless, transparency'] , ['jpg', 'JPG', 'Smaller file size']] as const).map(([val, label, desc]) => (
              <button key={val} onClick={() => setExportFormat(val)}
                style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${exportFormat === val ? '#8b5cf6' : '#1e1e40'}`, background: exportFormat === val ? 'rgba(139,92,246,0.12)' : '#111128', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  {val === 'png' ? <Image size={13} color={exportFormat === val ? '#a78bfa' : '#94a3b8'} /> : <FileImage size={13} color={exportFormat === val ? '#a78bfa' : '#94a3b8'} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: exportFormat === val ? '#a78bfa' : '#f0f0ff' }}>{label}</span>
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality (JPG only) */}
        {exportFormat === 'jpg' && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Quality</span>
              <span style={{ fontSize: 12, color: '#f0f0ff' }}>{Math.round(quality * 100)}%</span>
            </div>
            <input type="range" min="0.5" max="1" step="0.01" value={quality} onChange={e => setQuality(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#8b5cf6' }} />
          </div>
        )}

        {/* Scale */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Export Resolution</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3].map(s => (
              <button key={s} onClick={() => setScale(s)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: `1px solid ${scale === s ? '#8b5cf6' : '#1e1e40'}`, background: scale === s ? 'rgba(139,92,246,0.12)' : '#111128', cursor: 'pointer', fontSize: 14, fontWeight: scale === s ? 700 : 400, color: scale === s ? '#a78bfa' : '#94a3b8' }}>
                {s}×
              </button>
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#475569', textAlign: 'center' }}>
            Output: {format.width * scale} × {format.height * scale} px
          </div>
        </div>

        <button onClick={handleExport}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
          <Download size={16} /> Export {exportFormat.toUpperCase()}
        </button>

        <div style={{ marginTop: 12, padding: '10px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.12)', fontSize: 12, color: '#10b981', textAlign: 'center' }}>
          ✓ Free — No credits used for export
        </div>
      </div>
    </div>
  );
}
