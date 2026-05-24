'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit3, FolderOpen, Loader2, Clock, X } from 'lucide-react';
import { AD_FORMATS } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils';

interface Project { id: string; name: string; formatName: string; format: string; thumbnail: string | null; createdAt: string; updatedAt: string; }

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', format: AD_FORMATS[0] });

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  async function createProject() {
    if (!newProject.name.trim()) { toast.error('Enter a project name'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProject.name, format: `${newProject.format.width}x${newProject.format.height}`, formatName: newProject.format.name }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create'); return; }
      toast.success('Project created!');
      router.push(`/editor/${data.id}`);
    } catch { toast.error('Something went wrong'); }
    finally { setCreating(false); }
  }

  async function deleteProject(id: string, e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(ps => ps.filter(p => p.id !== id));
    toast.success('Project deleted');
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Projects</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 2 }}>{projects.length} total projects</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24, maxWidth: 400 }}>
        <Search size={16} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          style={{ width: '100%', padding: '10px 12px 10px 38px', background: '#111128', border: '1px solid #1e1e40', borderRadius: 10, color: '#f0f0ff', fontSize: 14, outline: 'none' }}
          onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
          onBlur={e => (e.target.style.borderColor = '#1e1e40')}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#475569' }}>
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#111128', borderRadius: 16, border: '1px dashed #2a2a55', padding: '60px 24px', textAlign: 'center' }}>
          <FolderOpen size={44} color="#2a2a55" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#475569', fontSize: 16, marginBottom: 20 }}>{search ? 'No projects match your search' : 'No projects yet'}</p>
          {!search && <button onClick={() => setShowCreate(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}><Plus size={16} />Create Project</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 18 }}>
          {filtered.map(p => (
            <Link key={p.id} href={`/editor/${p.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#111128', borderRadius: 14, border: '1px solid #1e1e40', overflow: 'hidden', transition: 'all 0.2s', position: 'relative', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.querySelector<HTMLElement>('.actions')!.style.opacity = '1'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e40'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.querySelector<HTMLElement>('.actions')!.style.opacity = '0'; }}>
                <div style={{ height: 140, background: 'linear-gradient(135deg, #1a1a3e, #111128)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1e1e40', position: 'relative', overflow: 'hidden' }}>
                  {p.thumbnail
                    ? <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: 14, opacity: 0.35 }} />}
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: '#0d0d24', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#94a3b8', border: '1px solid #1e1e40' }}>{p.formatName}</div>
                  <div className="actions" style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6, opacity: 0, transition: 'opacity 0.2s' }}>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} style={{ width: 30, height: 30, borderRadius: 8, background: '#111128', border: '1px solid #2a2a55', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><Edit3 size={13} /></button>
                    <button onClick={(e) => deleteProject(p.id, e)} style={{ width: 30, height: 30, borderRadius: 8, background: '#111128', border: '1px solid #2a2a55', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#f0f0ff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#475569' }}><Clock size={11} />{formatRelativeTime(p.updatedAt)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={() => setShowCreate(false)}>
          <div style={{ background: '#111128', borderRadius: 20, border: '1px solid #1e1e40', padding: 32, width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>New Project</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Project Name</label>
              <input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="My Awesome Ad" autoFocus
                style={{ width: '100%', padding: '11px 14px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 10, color: '#f0f0ff', fontSize: 14, outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')}
                onKeyDown={e => e.key === 'Enter' && createProject()} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>Ad Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {AD_FORMATS.slice(0, 8).map(f => (
                  <button key={f.id} onClick={() => setNewProject(p => ({ ...p, format: f }))}
                    style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${newProject.format.id === f.id ? '#8b5cf6' : '#1e1e40'}`, background: newProject.format.id === f.id ? 'rgba(139,92,246,0.12)' : '#0d0d24', color: newProject.format.id === f.id ? '#a78bfa' : '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: newProject.format.id === f.id ? 600 : 400, textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{f.width}×{f.height}</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createProject} disabled={creating}
              style={{ width: '100%', padding: '13px', borderRadius: 10, background: creating ? '#2a2a55' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: creating ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {creating ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={16} />Create & Open Editor</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
