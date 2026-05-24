'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ImageIcon, Clock, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import NextImage from 'next/image';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(628);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const FORMATS = [
    { label: 'Facebook Feed (1200×628)', width: 1200, height: 628 },
    { label: 'Instagram Square (1080×1080)', width: 1080, height: 1080 },
    { label: 'Instagram Story (1080×1920)', width: 1080, height: 1920 },
    { label: 'Twitter Card (1200×675)', width: 1200, height: 675 },
    { label: 'LinkedIn Banner (1200×627)', width: 1200, height: 627 },
    { label: 'YouTube Thumbnail (1280×720)', width: 1280, height: 720 },
  ];

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, width, height }),
    });
    const data = await res.json();
    if (res.ok) {
      onCreated();
      router.push(`/editor/${data.id}`);
    }
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">New Project</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Project name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Ad Campaign"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Format</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              onChange={(e) => {
                const [w, h] = e.target.value.split('x').map(Number);
                setWidth(w);
                setHeight(h);
              }}
            >
              {FORMATS.map((f) => (
                <option key={f.label} value={`${f.width}x${f.height}`} className="bg-slate-900">
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-white/10 hover:bg-white/5 text-sm py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create & Open'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading } = useSWR('/api/projects', fetcher);
  const projects = data?.projects ?? [];

  async function deleteProject(id: string) {
    if (!confirm('Delete this project?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    mutate('/api/projects');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">Create and manage your ad creatives</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl h-52 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-4">
            <Sparkles className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
          <p className="text-slate-400 text-sm mb-6">Create your first AI-powered ad creative</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {projects.map((project: any) => (
            <div
              key={project.id}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/40 transition-colors group"
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                {project.thumbnailUrl ? (
                  <NextImage
                    src={project.thumbnailUrl}
                    alt={project.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-600" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                  <Link
                    href={`/editor/${project.id}`}
                    className="p-1.5 bg-black/60 rounded-lg hover:bg-black/80 transition-colors"
                    title="Open editor"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => deleteProject(project.id)}
                    className="p-1.5 bg-black/60 rounded-lg hover:bg-red-500/80 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="font-medium text-sm truncate mb-1">{project.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {new Date(project.updatedAt).toLocaleDateString()}
                  <span className="ml-auto text-slate-500">{project.width}×{project.height}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={() => mutate('/api/projects')}
        />
      )}
    </div>
  );
}

