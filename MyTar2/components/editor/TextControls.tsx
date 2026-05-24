'use client';
import { useEditorStore } from '@/lib/store';
import { TextLayer, WEB_FONTS } from '@/lib/types';
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Globe } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid #1e1e40', padding: '14px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{children}</div>
    </div>
  );
}

const inputStyle = (w = 80): React.CSSProperties => ({
  width: w, padding: '5px 8px', background: '#111128', border: '1px solid #1e1e40', borderRadius: 7, color: '#f0f0ff', fontSize: 13, outline: 'none', textAlign: 'center',
});

const toggleBtn = (active: boolean): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: 6, background: active ? 'rgba(139,92,246,0.15)' : '#111128', border: `1px solid ${active ? 'rgba(139,92,246,0.4)' : '#1e1e40'}`, color: active ? '#a78bfa' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
});

export default function TextControls() {
  const { getSelectedLayer, updateLayer } = useEditorStore();
  const layer = getSelectedLayer() as TextLayer | null;
  if (!layer || layer.type !== 'text') return null;

  const update = (u: Partial<TextLayer>) => updateLayer(layer.id, u);

  return (
    <div>
      {/* Panel Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1e40', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Type size={14} color="#8b5cf6" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff' }}>Text Properties</span>
      </div>

      {/* Content */}
      <Section title="Content">
        <textarea
          value={layer.content}
          onChange={e => update({ content: e.target.value })}
          rows={3}
          style={{ width: '100%', padding: '8px 10px', background: '#111128', border: '1px solid #1e1e40', borderRadius: 8, color: '#f0f0ff', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
          onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button onClick={() => update({ isRTL: !layer.isRTL })} style={{ ...toggleBtn(layer.isRTL), flex: 1, width: 'auto', fontSize: 12, fontWeight: 600, gap: 4, padding: '0 8px' }}>
            <Globe size={12} /> {layer.isRTL ? 'RTL' : 'LTR'}
          </button>
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Font Family</div>
          <select value={layer.fontFamily} onChange={e => update({ fontFamily: e.target.value })}
            style={{ width: '100%', padding: '7px 10px', background: '#111128', border: '1px solid #1e1e40', borderRadius: 8, color: '#f0f0ff', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {WEB_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <Row label="Size">
          <input type="number" value={layer.fontSize} min={8} max={300} onChange={e => update({ fontSize: Number(e.target.value) })} style={inputStyle(70)} />
          <span style={{ fontSize: 12, color: '#475569' }}>px</span>
        </Row>
        <Row label="Weight">
          <select value={layer.fontWeight} onChange={e => update({ fontWeight: e.target.value })}
            style={{ ...inputStyle(90), textAlign: 'left', cursor: 'pointer' }}>
            {['300', '400', '500', '600', '700', '800', '900'].map(w => <option key={w} value={w}>{w === '300' ? 'Light' : w === '400' ? 'Regular' : w === '500' ? 'Medium' : w === '600' ? 'Semi Bold' : w === '700' ? 'Bold' : w === '800' ? 'Extra Bold' : 'Black'}</option>)}
          </select>
        </Row>
        <Row label="Style">
          <button onClick={() => update({ italic: !layer.italic })} style={toggleBtn(layer.italic)}><Italic size={13} /></button>
          <button onClick={() => update({ underline: !layer.underline })} style={toggleBtn(layer.underline)}><Underline size={13} /></button>
        </Row>
        <Row label="Align">
          <div style={{ display: 'flex', gap: 4 }}>
            {(['left', 'center', 'right'] as const).map((a, i) => (
              <button key={a} onClick={() => update({ alignment: a })} style={toggleBtn(layer.alignment === a)}>
                {i === 0 ? <AlignLeft size={13} /> : i === 1 ? <AlignCenter size={13} /> : <AlignRight size={13} />}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Color">
          <input type="color" value={layer.color} onChange={e => update({ color: e.target.value })}
            style={{ width: 36, height: 28, borderRadius: 7, border: '2px solid #2a2a55', cursor: 'pointer', padding: 2, background: 'none' }} />
          <input value={layer.color} onChange={e => update({ color: e.target.value })} style={{ ...inputStyle(80) }} placeholder="#ffffff" />
        </Row>
      </Section>

      {/* Spacing */}
      <Section title="Spacing">
        <Row label="Line Height">
          <input type="range" min="0.8" max="3" step="0.05" value={layer.lineHeight} onChange={e => update({ lineHeight: Number(e.target.value) })}
            style={{ width: 80, accentColor: '#8b5cf6' }} />
          <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 32, textAlign: 'right' }}>{layer.lineHeight.toFixed(1)}</span>
        </Row>
        <Row label="Letter Spacing">
          <input type="range" min="-5" max="20" step="0.5" value={layer.letterSpacing} onChange={e => update({ letterSpacing: Number(e.target.value) })}
            style={{ width: 80, accentColor: '#8b5cf6' }} />
          <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 32, textAlign: 'right' }}>{layer.letterSpacing}px</span>
        </Row>
        <Row label="Opacity">
          <input type="range" min="0" max="1" step="0.01" value={layer.opacity} onChange={e => update({ opacity: Number(e.target.value) })}
            style={{ width: 80, accentColor: '#8b5cf6' }} />
          <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 32, textAlign: 'right' }}>{Math.round(layer.opacity * 100)}%</span>
        </Row>
      </Section>

      {/* Shadow */}
      <Section title="Shadow">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Enable Shadow</span>
          <div onClick={() => update({ shadow: { ...layer.shadow, enabled: !layer.shadow.enabled } })}
            style={{ width: 40, height: 22, background: layer.shadow.enabled ? '#8b5cf6' : '#1e1e40', borderRadius: 11, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: 2, left: layer.shadow.enabled ? 20 : 2, width: 18, height: 18, background: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
          </div>
        </div>
        {layer.shadow.enabled && (
          <>
            <Row label="Color">
              <input type="color" value={layer.shadow.color} onChange={e => update({ shadow: { ...layer.shadow, color: e.target.value } })}
                style={{ width: 36, height: 28, borderRadius: 7, border: '2px solid #2a2a55', cursor: 'pointer', padding: 2 }} />
            </Row>
            <Row label="Blur">
              <input type="range" min="0" max="30" value={layer.shadow.blur} onChange={e => update({ shadow: { ...layer.shadow, blur: Number(e.target.value) } })}
                style={{ width: 80, accentColor: '#8b5cf6' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 28, textAlign: 'right' }}>{layer.shadow.blur}</span>
            </Row>
            <Row label="Offset X">
              <input type="range" min="-20" max="20" value={layer.shadow.offsetX} onChange={e => update({ shadow: { ...layer.shadow, offsetX: Number(e.target.value) } })}
                style={{ width: 80, accentColor: '#8b5cf6' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 28, textAlign: 'right' }}>{layer.shadow.offsetX}</span>
            </Row>
            <Row label="Offset Y">
              <input type="range" min="-20" max="20" value={layer.shadow.offsetY} onChange={e => update({ shadow: { ...layer.shadow, offsetY: Number(e.target.value) } })}
                style={{ width: 80, accentColor: '#8b5cf6' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 28, textAlign: 'right' }}>{layer.shadow.offsetY}</span>
            </Row>
          </>
        )}
      </Section>

      {/* Stroke */}
      <Section title="Stroke">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Enable Stroke</span>
          <div onClick={() => update({ stroke: { ...layer.stroke, enabled: !layer.stroke.enabled } })}
            style={{ width: 40, height: 22, background: layer.stroke.enabled ? '#8b5cf6' : '#1e1e40', borderRadius: 11, position: 'relative', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: 2, left: layer.stroke.enabled ? 20 : 2, width: 18, height: 18, background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
          </div>
        </div>
        {layer.stroke.enabled && (
          <>
            <Row label="Color">
              <input type="color" value={layer.stroke.color} onChange={e => update({ stroke: { ...layer.stroke, color: e.target.value } })}
                style={{ width: 36, height: 28, borderRadius: 7, border: '2px solid #2a2a55', cursor: 'pointer', padding: 2 }} />
            </Row>
            <Row label="Width">
              <input type="range" min="0.5" max="10" step="0.5" value={layer.stroke.width} onChange={e => update({ stroke: { ...layer.stroke, width: Number(e.target.value) } })}
                style={{ width: 80, accentColor: '#8b5cf6' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 28, textAlign: 'right' }}>{layer.stroke.width}px</span>
            </Row>
          </>
        )}
      </Section>

      {/* Position */}
      <Section title="Position & Size">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[['X', 'x'], ['Y', 'y'], ['W', 'width'], ['H', 'height']].map(([label, key]) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{label}</div>
              <input type="number" value={Math.round((layer as unknown as Record<string, number>)[key])} onChange={e => update({ [key]: Number(e.target.value) } as Partial<TextLayer>)}
                style={{ width: '100%', padding: '6px 8px', background: '#111128', border: '1px solid #1e1e40', borderRadius: 7, color: '#f0f0ff', fontSize: 12, outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Rotation</div>
          <input type="range" min="-180" max="180" value={layer.rotation} onChange={e => update({ rotation: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#8b5cf6' }} />
          <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>{layer.rotation}°</div>
        </div>
      </Section>
    </div>
  );
}
