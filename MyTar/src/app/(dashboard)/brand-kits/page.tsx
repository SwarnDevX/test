'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Palette, Trash2, Edit2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PRESET_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#000000', '#FFFFFF'];

function BrandKitModal({ kit, onClose }: { kit?: any; onClose: () => void }) {
  const [name, setName] = useState(kit?.name ?? '');
  const [colors, setColors] = useState<string[]>(kit?.colors ?? ['#3B82F6', '#FFFFFF', '#1E293B']);
  const [newColor, setNewColor] = useState('#000000');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const method = kit ? 'PATCH' : 'POST';
    const url = kit ? `/api/brand-kits/${kit.id}` : '/api/brand-kits';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, colors }),
    });
    mutate('/api/brand-kits');
    setLoading(false);
    onClose();
  }

  function addColor() {
    if (!colors.includes(newColor)) setColors([...colors, newColor]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">{kit ? 'Edit Brand Kit' : 'New Brand Kit'}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Brand"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Brand Colors</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {colors.map((c) => (
                <div key={c} className="relative group">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-white/20 cursor-pointer"
                    style={{ background: c }}
                  />
                  <button
                    onClick={() => setColors(colors.filter((x) => x !== c))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs hidden group-hover:flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-6 h-6 rounded border border-white/20"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                onClick={addColor}
                className="ml-auto text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-white/10 hover:bg-white/5 text-sm py-2.5 rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2.5 rounded-lg"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrandKitsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editKit, setEditKit] = useState<any>(null);
  const { data, isLoading } = useSWR('/api/brand-kits', fetcher);
  const kits = data?.brandKits ?? [];

  async function deleteKit(id: string) {
    if (!confirm('Delete this brand kit?')) return;
    await fetch(`/api/brand-kits/${id}`, { method: 'DELETE' });
    mutate('/api/brand-kits');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Brand Kits</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your brand colors and assets</p>
        </div>
        <button
          onClick={() => { setEditKit(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          New Brand Kit
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-36 animate-pulse" />
          ))}
        </div>
      ) : kits.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
            <Palette className="h-8 w-8 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No brand kits yet</h2>
          <p className="text-slate-400 text-sm mb-6">Create a brand kit to keep your designs consistent</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium px-5 py-2.5 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Create Brand Kit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {kits.map((kit: any) => (
            <div key={kit.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-purple-500/40 transition-colors group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{kit.name}</h3>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditKit(kit); setShowModal(true); }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteKit(kit.id)}
                    className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(kit.colors as string[]).map((c) => (
                  <div
                    key={c}
                    className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0"
                    style={{ background: c }}
                    title={c}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">{kit.colors.length} colors</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BrandKitModal kit={editKit} onClose={() => { setShowModal(false); setEditKit(null); }} />
      )}
    </div>
  );
}

