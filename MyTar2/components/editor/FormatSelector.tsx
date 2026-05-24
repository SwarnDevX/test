'use client';
import { useEditorStore } from '@/lib/store';
import { AD_FORMATS, AdFormat } from '@/lib/types';
import { LayoutGrid } from 'lucide-react';

const categories = [...new Set(AD_FORMATS.map(f => f.category))];

export default function FormatSelector() {
  const { format, setFormat } = useEditorStore();

  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e40', display: 'flex', alignItems: 'center', gap: 8 }}>
        <LayoutGrid size={14} color="#8b5cf6" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff' }}>Canvas Format</span>
      </div>
      <div style={{ padding: 12, overflowY: 'auto' }}>
        {categories.map(cat => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, paddingLeft: 4 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {AD_FORMATS.filter(f => f.category === cat).map(f => (
                <button key={f.id} onClick={() => setFormat(f)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, border: `1px solid ${format.id === f.id ? '#8b5cf6' : '#1e1e40'}`, background: format.id === f.id ? 'rgba(139,92,246,0.12)' : '#111128', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { if (format.id !== f.id) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = '#2a2a55'; } }}
                  onMouseLeave={e => { if (format.id !== f.id) { e.currentTarget.style.background = '#111128'; e.currentTarget.style.borderColor = '#1e1e40'; } }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{
                        background: format.id === f.id ? '#8b5cf6' : '#2a2a55',
                        borderRadius: 3,
                        width: Math.min(24, 24 * (f.width / Math.max(f.width, f.height))),
                        height: Math.min(24, 24 * (f.height / Math.max(f.width, f.height))),
                      }} />
                    </div>
                    <span style={{ fontSize: 13, color: format.id === f.id ? '#a78bfa' : '#94a3b8', fontWeight: format.id === f.id ? 600 : 400 }}>{f.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#475569' }}>{f.width}×{f.height}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
