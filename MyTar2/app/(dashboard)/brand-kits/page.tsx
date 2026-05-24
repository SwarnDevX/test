'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Palette, Upload, X, Loader2 } from 'lucide-react';

interface BrandKit { id: string; name: string; colors: string[]; fonts: string[]; logos: string[]; }

const FONT_OPTIONS = ['Inter', 'Roboto', 'Montserrat', 'Poppins', 'Raleway', 'Oswald', 'Merriweather', 'Playfair Display', 'Lato', 'Open Sans'];

export default function BrandKitsPage() {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<BrandKit | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: '', colors: ['#8b5cf6', '#3b82f6', '#10b981'], fonts: ['Inter'], logos: [] as string[] });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch('/api/brand-kits').then(r => r.json()).then(setKits).finally(() => setLoading(false)); }, []);

  function openCreate() { setDraft({ name: '', colors: ['#8b5cf6', '#3b82f6', '#10b981'], fonts: ['Inter'], logos: [] }); setEditing(null); setShowCreate(true); }
  function openEdit(kit: BrandKit) { setDraft({ name: kit.name, colors: kit.colors, fonts: kit.fonts, logos: kit.logos }); setEditing(kit); setShowCreate(true); }

  async function save() {
    if (!draft.name.trim()) { toast.error('Enter a kit name'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/brand-kits/${editing.id}` : '/api/brand-kits';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      if (editing) setKits(ks => ks.map(k => k.id === editing.id ? data : k));
      else setKits(ks => [...ks, data]);
      toast.success(editing ? 'Brand kit updated' : 'Brand kit created');
      setShowCreate(false);
    } catch { toast.error('Error saving'); }
    finally { setSaving(false); }
  }

  async function deleteKit(id: string) {
    if (!confirm('Delete this brand kit?')) return;
    await fetch(`/api/brand-kits/${id}`, { method: 'DELETE' });
    setKits(ks => ks.filter(k => k.id !== id));
    toast.success('Deleted');
  }

  function addColor() { setDraft(d => ({ ...d, colors: [...d.colors, '#ffffff'] })); }
  function updateColor(i: number, v: string) { setDraft(d => ({ ...d, colors: d.colors.map((c, ci) => ci === i ? v : c) })); }
  function removeColor(i: number) { setDraft(d => ({ ...d, colors: d.colors.filter((_, ci) => ci !== i) })); }
  function toggleFont(f: string) { setDraft(d => ({ ...d, fonts: d.fonts.includes(f) ? d.fonts.filter(x => x !== f) : [...d.fonts, f] })); }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Brand Kits</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 2 }}>Manage colors, fonts, and logos for your brands</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
          <Plus size={16} /> New Brand Kit
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" color="#8b5cf6" /></div>
      ) : kits.length === 0 ? (
        <div style={{ background: '#111128', borderRadius: 16, border: '1px dashed #2a2a55', padding: '60px 24px', textAlign: 'center' }}>
          <Palette size={44} color="#2a2a55" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#475569', fontSize: 15, marginBottom: 20 }}>No brand kits yet. Create one to save your brand assets.</p>
          <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}><Plus size={16} />Create Brand Kit</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {kits.map(kit => (
            <div key={kit.id} style={{ background: '#111128', borderRadius: 16, border: '1px solid #1e1e40', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 16 }}>{kit.name}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(kit)} style={{ width: 32, height: 32, borderRadius: 8, background: '#0d0d24', border: '1px solid #1e1e40', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}><Palette size={14} /></button>
                  <button onClick={() => deleteKit(kit.id)} style={{ width: 32, height: 32, borderRadius: 8, background: '#0d0d24', border: '1px solid #1e1e40', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Colors</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {kit.colors.map((c, i) => <div key={i} title={c} style={{ width: 32, height: 32, borderRadius: 8, background: c, border: '2px solid rgba(255,255,255,0.1)' }} />)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Fonts</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {kit.fonts.map(f => <span key={f} style={{ padding: '3px 10px', background: '#0d0d24', borderRadius: 100, border: '1px solid #1e1e40', fontSize: 12, color: '#94a3b8' }}>{f}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }} onClick={() => setShowCreate(false)}>
          <div style={{ background: '#111128', borderRadius: 20, border: '1px solid #1e1e40', padding: 32, width: '100%', maxWidth: 520, maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{editing ? 'Edit' : 'New'} Brand Kit</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Kit Name</label>
              <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="My Brand" autoFocus
                style={{ width: '100%', padding: '11px 14px', background: '#0d0d24', border: '1px solid #1e1e40', borderRadius: 10, color: '#f0f0ff', fontSize: 14, outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#1e1e40')} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Brand Colors</label>
                <button onClick={addColor} style={{ fontSize: 12, color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} />Add</button>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {draft.colors.map((c, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <input type="color" value={c} onChange={e => updateColor(i, e.target.value)} style={{ width: 44, height: 44, borderRadius: 10, border: '2px solid #2a2a55', cursor: 'pointer', padding: 2, background: 'none' }} />
                    <button onClick={() => removeColor(i)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10 }}><X size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>Brand Fonts</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {FONT_OPTIONS.map(f => (
                  <button key={f} onClick={() => toggleFont(f)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${draft.fonts.includes(f) ? '#8b5cf6' : '#1e1e40'}`, background: draft.fonts.includes(f) ? 'rgba(139,92,246,0.12)' : '#0d0d24', color: draft.fonts.includes(f) ? '#a78bfa' : '#94a3b8', cursor: 'pointer', fontSize: 13, textAlign: 'left', fontFamily: f }}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={save} disabled={saving} style={{ width: '100%', padding: '13px', borderRadius: 10, background: saving ? '#2a2a55' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {saving ? <Loader2 size={18} className="animate-spin" /> : `${editing ? 'Update' : 'Create'} Brand Kit`}
            </button>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} />
    </div>
  );
}
