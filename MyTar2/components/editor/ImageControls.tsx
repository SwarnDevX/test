'use client';
import { useEditorStore } from '@/lib/store';
import { LogoLayer, AssetLayer } from '@/lib/types';
import { Image } from 'lucide-react';

export default function ImageControls() {
  const { getSelectedLayer, updateLayer } = useEditorStore();
  const layer = getSelectedLayer() as LogoLayer | AssetLayer | null;
  if (!layer || (layer.type !== 'logo' && layer.type !== 'asset')) return null;
  const update = (u: Partial<typeof layer>) => updateLayer(layer.id, u);

  return (
    <div>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e40', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Image size={14} color={layer.type === 'logo' ? '#3b82f6' : '#10b981'} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff' }}>{layer.type === 'logo' ? 'Logo' : 'Asset'} Properties</span>
      </div>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e40' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Dimensions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[['W', 'width'], ['H', 'height'], ['X', 'x'], ['Y', 'y']].map(([label, key]) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{label}</div>
              <input type="number" value={Math.round((layer as unknown as Record<string, number>)[key])} onChange={e => update({ [key]: Number(e.target.value) } as Partial<typeof layer>)}
                style={{ width: '100%', padding: '6px 8px', background: '#111128', border: '1px solid #1e1e40', borderRadius: 7, color: '#f0f0ff', fontSize: 12, outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')} />
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Rotation</div>
          <input type="range" min="-180" max="180" value={layer.rotation} onChange={e => update({ rotation: Number(e.target.value) } as Partial<typeof layer>)}
            style={{ width: '100%', accentColor: '#8b5cf6' }} />
          <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>{layer.rotation}°</div>
        </div>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Opacity</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="range" min="0" max="1" step="0.01" value={layer.opacity} onChange={e => update({ opacity: Number(e.target.value) } as Partial<typeof layer>)}
            style={{ flex: 1, accentColor: '#8b5cf6' }} />
          <span style={{ fontSize: 13, color: '#94a3b8', minWidth: 36, textAlign: 'right' }}>{Math.round(layer.opacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
