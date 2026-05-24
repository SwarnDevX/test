'use client';
import { useEditorStore } from '@/lib/store';
import { BackgroundLayer, GRADIENT_PRESETS } from '@/lib/types';
import { Layers } from 'lucide-react';

export default function BackgroundControls() {
  const { getSelectedLayer, updateLayer } = useEditorStore();
  const layer = getSelectedLayer() as BackgroundLayer | null;
  if (!layer || layer.type !== 'background') return null;
  const update = (u: Partial<BackgroundLayer>) => updateLayer(layer.id, u);

  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e40', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Layers size={14} color="#f59e0b" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff' }}>Background</span>
      </div>

      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e40' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            { label: 'Solid', value: false, noImg: true },
            { label: 'Gradient', value: true, noImg: true },
            { label: 'Image', value: false, noImg: false },
          ].map(({ label }, i) => (
            <button key={label} onClick={() => {
              if (i === 0) update({ useGradient: false, imageUrl: null });
              if (i === 1) update({ useGradient: true, imageUrl: null });
            }}
              style={{ padding: '8px 4px', borderRadius: 8, border: `1px solid ${(i === 0 && !layer.useGradient && !layer.imageUrl) || (i === 1 && layer.useGradient) || (i === 2 && layer.imageUrl) ? '#8b5cf6' : '#1e1e40'}`, background: (i === 0 && !layer.useGradient && !layer.imageUrl) || (i === 1 && layer.useGradient) || (i === 2 && layer.imageUrl) ? 'rgba(139,92,246,0.12)' : '#111128', color: '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {!layer.useGradient && !layer.imageUrl && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e40' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Solid Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={layer.color} onChange={e => update({ color: e.target.value })}
              style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid #2a2a55', cursor: 'pointer', padding: 2, background: 'none' }} />
            <input value={layer.color} onChange={e => update({ color: e.target.value })}
              style={{ flex: 1, padding: '7px 10px', background: '#111128', border: '1px solid #1e1e40', borderRadius: 8, color: '#f0f0ff', fontSize: 13, outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')} />
          </div>
        </div>
      )}

      {layer.useGradient && (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e40' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Gradient Presets</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 14 }}>
            {GRADIENT_PRESETS.map(p => (
              <button key={p.name} onClick={() => update({ gradientFrom: p.from, gradientTo: p.to })} title={p.name}
                style={{ height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${p.from}, ${p.to})`, border: layer.gradientFrom === p.from ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>From</div>
              <input type="color" value={layer.gradientFrom} onChange={e => update({ gradientFrom: e.target.value })}
                style={{ width: '100%', height: 34, borderRadius: 8, border: '2px solid #2a2a55', cursor: 'pointer', padding: 2 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>To</div>
              <input type="color" value={layer.gradientTo} onChange={e => update({ gradientTo: e.target.value })}
                style={{ width: '100%', height: 34, borderRadius: 8, border: '2px solid #2a2a55', cursor: 'pointer', padding: 2 }} />
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Opacity</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="range" min="0" max="1" step="0.01" value={layer.opacity} onChange={e => update({ opacity: Number(e.target.value) })}
            style={{ flex: 1, accentColor: '#8b5cf6' }} />
          <span style={{ fontSize: 13, color: '#94a3b8', minWidth: 36, textAlign: 'right' }}>{Math.round(layer.opacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
