'use client';
import { Type, Image, Layers, Palette, Download, Cpu } from 'lucide-react';
import { useEditorStore, makeTextLayer } from '@/lib/store';
import toast from 'react-hot-toast';

export default function Toolbar() {
  const { addLayer, activePanel, setActivePanel } = useEditorStore();

  const tools = [
    { icon: Type, label: 'Text', action: () => { addLayer(makeTextLayer()); toast.success('Text layer added'); } },
    { icon: Image, label: 'Image', action: () => {} },
    { icon: Layers, label: 'Layers', action: () => setActivePanel(activePanel === 'layers' ? null : 'layers') },
    { icon: Palette, label: 'Brand', action: () => setActivePanel(activePanel === 'brand' ? null : 'brand') },
    { icon: Cpu, label: 'AI', action: () => setActivePanel(activePanel === 'ai' ? null : 'ai') },
    { icon: Download, label: 'Export', action: () => setActivePanel(activePanel === 'export' ? null : 'export') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 6px', borderRight: '1px solid #1e1e40', background: '#0d0d24', alignItems: 'center' }}>
      {tools.map(({ icon: Icon, label, action }) => (
        <button key={label} onClick={action} title={label}
          style={{ width: 40, height: 40, borderRadius: 10, background: 'transparent', border: '1px solid transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: '#94a3b8', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#111128'; e.currentTarget.style.borderColor = '#1e1e40'; e.currentTarget.style.color = '#f0f0ff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
          <Icon size={18} />
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.02em' }}>{label}</span>
        </button>
      ))}
    </div>
  );
}
