'use client';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Zap, ChevronLeft, Save, Download, Undo2, Redo2, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { downloadDataUrl } from '@/lib/utils';

interface Props {
  project: { id: string; name: string; };
  user: { credits: number; };
}

export default function EditorHeader({ project, user }: Props) {
  const { zoom, setZoom, layers, isDirty, isSaving, setSaving, setDirty, activePanel, setActivePanel } = useEditorStore();

  async function saveProject() {
    if (!isDirty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasState: { layers } }),
      });
      if (res.ok) { setDirty(false); toast.success('Project saved'); }
      else toast.error('Failed to save');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  function openExport() {
    setActivePanel(activePanel === 'export' ? null : 'export');
  }

  return (
    <header style={{ height: 56, background: '#0d0d24', borderBottom: '1px solid #1e1e40', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
      {/* Back */}
      <Link href="/projects" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', textDecoration: 'none', fontSize: 14, flexShrink: 0, padding: '4px 8px', borderRadius: 8 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#f0f0ff')} onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
        <ChevronLeft size={16} /> Back
      </Link>

      <div style={{ width: 1, height: 24, background: '#1e1e40' }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={14} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#f0f0ff' }}>
          AdCreative<span style={{ color: '#8b5cf6' }}>AI</span>
        </span>
      </div>

      <div style={{ width: 1, height: 24, background: '#1e1e40' }} />

      {/* Project Name */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
        {project.name}
      </div>
      {isDirty && <div style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', flexShrink: 0 }} />}

      <div style={{ flex: 1 }} />

      {/* Undo/Redo */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[{ icon: Undo2, label: 'Undo', action: () => {} }, { icon: Redo2, label: 'Redo', action: () => {} }].map(({ icon: Icon, label, action }) => (
          <button key={label} onClick={action} title={label} style={{ width: 34, height: 34, borderRadius: 8, background: 'transparent', border: '1px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#111128'; e.currentTarget.style.borderColor = '#1e1e40'; e.currentTarget.style.color = '#f0f0ff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
            <Icon size={16} />
          </button>
        ))}
      </div>

      {/* Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#111128', borderRadius: 8, border: '1px solid #1e1e40' }}>
        <button onClick={() => setZoom(zoom - 0.1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}><ZoomOut size={14} /></button>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff', minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom + 0.1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}><ZoomIn size={14} /></button>
      </div>

      {/* Credits */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
        <Zap size={13} />{user.credits}
      </div>

      {/* Save */}
      <button onClick={saveProject} disabled={!isDirty || isSaving}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: isDirty ? '#111128' : 'transparent', border: `1px solid ${isDirty ? '#2a2a55' : '#1e1e40'}`, color: isDirty ? '#f0f0ff' : '#475569', cursor: isDirty ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600 }}>
        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save
      </button>

      {/* Export */}
      <button onClick={openExport}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, boxShadow: '0 0 15px rgba(139,92,246,0.3)' }}>
        <Download size={14} /> Export
      </button>
    </header>
  );
}
