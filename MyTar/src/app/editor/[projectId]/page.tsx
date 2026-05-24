'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Konva from 'konva';
import { useCanvasStore } from '@/store/canvasStore';
import LayerPanel from '@/components/editor/LayerPanel';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import EditorToolbar from '@/components/editor/EditorToolbar';
import BrandPanel from '@/components/editor/BrandPanel';
import ExportPanel from '@/components/editor/ExportPanel';
import { debounce } from '@/lib/utils';

// Dynamically import CanvasStage to avoid SSR issues with Konva
const CanvasStage = dynamic(() => import('@/components/editor/CanvasStage'), { ssr: false });

export default function EditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [projectName, setProjectName] = useState('Untitled Project');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [brandPanelOpen, setBrandPanelOpen] = useState(false);
  const [exportPanelOpen, setExportPanelOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const { loadCanvasState, getCanvasState, markSaved, isDirty, undo, redo } = useCanvasStore();

  // Load project
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.project) {
          setProjectName(data.project.name);
          if (data.project.canvasState && Object.keys(data.project.canvasState).length > 0) {
            loadCanvasState(data.project.canvasState);
          } else {
            // Initialize with empty canvas at project size
            loadCanvasState({
              layers: [],
              width: data.project.width,
              height: data.project.height,
              backgroundColor: '#1a1a2e',
            });
          }
        }
      })
      .finally(() => setLoading(false));
  }, [projectId, loadCanvasState]);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);
    setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // handleSave as stable callback
  const handleSave = useCallback(async () => {
    setSaving(true);
    const state = getCanvasState();
    await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasState: state }),
    });
    markSaved();
    setSaving(false);
  }, [projectId, getCanvasState, markSaved]);

  // Auto-save debounced
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(debounce(handleSave, 2000), [handleSave]);

  useEffect(() => {
    if (isDirty) debouncedSave();
  }, [isDirty, debouncedSave]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        if (e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 's') { e.preventDefault(); handleSave(); }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, handleSave]);

  async function handleExport() {
    setExportPanelOpen(true);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <div className="text-sm text-slate-400">Loading editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      <EditorToolbar
        projectId={projectId}
        projectName={projectName}
        onSave={handleSave}
        onExport={handleExport}
        saving={saving}
        exporting={exporting}
        onBrandPanel={() => setBrandPanelOpen(!brandPanelOpen)}
        onExportPanel={() => setExportPanelOpen(!exportPanelOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <LayerPanel />

        {/* Canvas area */}
        <div ref={containerRef} className="flex-1 overflow-hidden relative">
          {containerSize.width > 0 && (
            <CanvasStage
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              stageRef={stageRef}
            />
          )}

          {/* Save indicator */}
          {isDirty && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 text-xs text-slate-400 px-3 py-1.5 rounded-full">
              Unsaved changes
            </div>
          )}
        </div>

        <PropertiesPanel />
      </div>

      {/* Side panels */}
      <BrandPanel open={brandPanelOpen} onClose={() => setBrandPanelOpen(false)} />
      <ExportPanel
        open={exportPanelOpen}
        onClose={() => setExportPanelOpen(false)}
        stageRef={stageRef}
        projectName={projectName}
        projectId={projectId}
      />
    </div>
  );
}

