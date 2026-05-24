'use client';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronUp, ChevronDown, Type, Image, Layers, Plus, Upload } from 'lucide-react';
import { useEditorStore, makeTextLayer, makeLogoLayer, makeAssetLayer } from '@/lib/store';
import { Layer } from '@/lib/types';

const LayerIcon = ({ type }: { type: Layer['type'] }) => {
  if (type === 'text') return <Type size={13} color="#a78bfa" />;
  if (type === 'logo') return <Image size={13} color="#3b82f6" />;
  if (type === 'asset') return <Image size={13} color="#10b981" />;
  return <Layers size={13} color="#f59e0b" />;
};

export default function LayerPanel() {
  const { layers, selectedLayerId, selectLayer, addLayer, removeLayer, updateLayer, moveLayerUp, moveLayerDown, duplicateLayer, toggleLayerVisibility, toggleLayerLock } = useEditorStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadType = useRef<'logo' | 'asset'>('asset');

  const displayLayers = [...layers].reverse();

  function addText() {
    addLayer(makeTextLayer());
    toast.success('Text layer added');
  }

  function triggerUpload(type: 'logo' | 'asset') {
    uploadType.current = type;
    fileRef.current?.click();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Upload failed'); return; }
    if (uploadType.current === 'logo') addLayer(makeLogoLayer(data.url));
    else addLayer(makeAssetLayer(data.url));
    toast.success('Image uploaded');
    e.target.value = '';
  }

  return (
    <aside style={{ width: 220, background: '#0d0d24', borderRight: '1px solid #1e1e40', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e1e40', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <Layers size={13} /> Layers
        </div>
        <span style={{ fontSize: 11, color: '#475569' }}>{layers.length}</span>
      </div>

      {/* Add Buttons */}
      <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid #1e1e40', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={addText} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa', cursor: 'pointer', fontSize: 13, fontWeight: 600, width: '100%' }}>
          <Plus size={13} /><Type size={13} /> Add Text
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button onClick={() => triggerUpload('logo')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 8px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa', cursor: 'pointer', fontSize: 12, fontWeight: 600, justifyContent: 'center' }}>
            <Upload size={12} /> Logo
          </button>
          <button onClick={() => triggerUpload('asset')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 8px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', cursor: 'pointer', fontSize: 12, fontWeight: 600, justifyContent: 'center' }}>
            <Upload size={12} /> Asset
          </button>
        </div>
      </div>

      {/* Layer List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {displayLayers.map(layer => {
          const selected = selectedLayerId === layer.id;
          return (
            <div key={layer.id}
              onClick={() => selectLayer(layer.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 8px', borderRadius: 8, marginBottom: 3, cursor: 'pointer', background: selected ? 'rgba(139,92,246,0.12)' : 'transparent', border: `1px solid ${selected ? 'rgba(139,92,246,0.3)' : 'transparent'}`, userSelect: 'none' }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}>
              <LayerIcon type={layer.type} />
              <span style={{ flex: 1, fontSize: 13, color: selected ? '#f0f0ff' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selected ? 600 : 400 }}>
                {layer.name}
              </span>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button onClick={e => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} title={layer.visible ? 'Hide' : 'Show'}
                  style={{ width: 22, height: 22, borderRadius: 5, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: layer.visible ? '#94a3b8' : '#2a2a55' }}>
                  {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button onClick={e => { e.stopPropagation(); toggleLayerLock(layer.id); }} title={layer.locked ? 'Unlock' : 'Lock'}
                  style={{ width: 22, height: 22, borderRadius: 5, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: layer.locked ? '#f59e0b' : '#94a3b8' }}>
                  {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
              {selected && (
                <div style={{ position: 'absolute', right: 8, display: 'flex', flexDirection: 'column', gap: 2, background: '#111128', borderRadius: 6, border: '1px solid #1e1e40', padding: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Layer Actions */}
      {selectedLayerId && (
        <div style={{ padding: '8px 10px', borderTop: '1px solid #1e1e40', display: 'flex', gap: 4, justifyContent: 'center' }}>
          {[
            { icon: ChevronUp, label: 'Move Up', action: () => moveLayerUp(selectedLayerId) },
            { icon: ChevronDown, label: 'Move Down', action: () => moveLayerDown(selectedLayerId) },
            { icon: Copy, label: 'Duplicate', action: () => duplicateLayer(selectedLayerId) },
            { icon: Trash2, label: 'Delete', action: () => { removeLayer(selectedLayerId); toast.success('Layer deleted'); }, danger: true },
          ].map(({ icon: Icon, label, action, danger }) => (
            <button key={label} onClick={action} title={label}
              style={{ flex: 1, height: 30, borderRadius: 7, background: danger ? 'rgba(239,68,68,0.1)' : '#111128', border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : '#1e1e40'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: danger ? '#ef4444' : '#94a3b8' }}>
              <Icon size={13} />
            </button>
          ))}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
    </aside>
  );
}
