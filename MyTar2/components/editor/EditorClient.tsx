'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/lib/store';
import EditorHeader from './EditorHeader';
import LayerPanel from './LayerPanel';
import PropertiesPanel from './PropertiesPanel';
import Toolbar from './Toolbar';
import { Layer, AD_FORMATS } from '@/lib/types';

const CanvasEditor = dynamic(() => import('./Canvas'), { ssr: false, loading: () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1e' }}>
    <div style={{ width: 40, height: 40, border: '3px solid #1e1e40', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
  </div>
) });

interface Props {
  project: { id: string; name: string; format: string; formatName: string; canvasState: { layers: Layer[] }; thumbnail: string | null; createdAt: string; updatedAt: string; };
  user: { id: string; email: string; name: string | null; credits: number; subscription: string; };
}

export default function EditorClient({ project, user }: Props) {
  const { loadLayers, setFormat, format } = useEditorStore();

  useEffect(() => {
    // Load format
    const [w, h] = project.format.split('x').map(Number);
    if (w && h) {
      const fmt = AD_FORMATS.find(f => f.width === w && f.height === h) || { id: 'custom', name: project.formatName, category: 'Custom', width: w, height: h };
      setFormat(fmt);
    }
    // Load layers
    if (project.canvasState?.layers?.length > 0) {
      loadLayers(project.canvasState.layers as Layer[]);
    }
  }, [project.id]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#07071a', overflow: 'hidden' }}>
      <EditorHeader project={project} user={user} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Toolbar />
        <LayerPanel />
        <CanvasEditor />
        <PropertiesPanel />
      </div>
    </div>
  );
}
