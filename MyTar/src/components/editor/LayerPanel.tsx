'use client';

import { useCanvasStore } from '@/store/canvasStore';
import { Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronUp, ChevronDown, Type, ImageIcon, Square, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Layer } from '@/types/canvas';

function LayerIcon({ type }: { type: Layer['type'] }) {
  switch (type) {
    case 'text': return <Type className="h-3.5 w-3.5" />;
    case 'image': return <ImageIcon className="h-3.5 w-3.5" />;
    case 'shape': return <Square className="h-3.5 w-3.5" />;
    default: return <Layers className="h-3.5 w-3.5" />;
  }
}

export default function LayerPanel() {
  const {
    layers,
    selectedId,
    setSelectedId,
    deleteLayer,
    duplicateLayer,
    reorderLayer,
    toggleVisibility,
    toggleLock,
  } = useCanvasStore();

  const sorted = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-56 bg-slate-900 border-r border-white/10 flex flex-col">
      <div className="px-3 py-2.5 border-b border-white/10">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Layers</span>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5 px-1.5">
        {sorted.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">No layers yet</div>
        ) : (
          sorted.map((layer) => (
            <div
              key={layer.id}
              onClick={() => setSelectedId(layer.id)}
              className={cn(
                'layer-panel-item group',
                selectedId === layer.id && 'selected',
                !layer.visible && 'opacity-40'
              )}
            >
              <LayerIcon type={layer.type} />
              <span className="flex-1 truncate text-xs">{layer.name}</span>

              {/* Actions (visible on hover) */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'up'); }}
                  className="p-0.5 hover:bg-white/10 rounded"
                  title="Move up"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); reorderLayer(layer.id, 'down'); }}
                  className="p-0.5 hover:bg-white/10 rounded"
                  title="Move down"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                  className="p-0.5 hover:bg-white/10 rounded"
                  title="Toggle visibility"
                >
                  {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}
                  className="p-0.5 hover:bg-white/10 rounded"
                  title="Toggle lock"
                >
                  {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                  className="p-0.5 hover:bg-white/10 rounded"
                  title="Duplicate"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                  className="p-0.5 hover:bg-red-500/30 text-red-400 rounded"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

