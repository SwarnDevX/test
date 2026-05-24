import { create } from 'zustand';
import { Layer, BackgroundLayer, TextLayer, ImageLayer, ShapeLayer, CanvasState } from '@/types/canvas';
import { generateId } from '@/lib/utils';

interface CanvasStore {
  // Canvas state
  layers: Layer[];
  width: number;
  height: number;
  backgroundColor: string;
  selectedId: string | null;
  hoveredId: string | null;

  // History
  past: Layer[][];
  future: Layer[][];

  // UI state
  isDirty: boolean;

  // Actions
  setCanvasSize: (width: number, height: number) => void;
  setBackgroundColor: (color: string) => void;
  loadLayers: (layers: Layer[]) => void;
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;

  addLayer: (layer: Omit<Layer, 'id' | 'zIndex'>) => string;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  reorderLayer: (id: string, direction: 'up' | 'down') => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;

  undo: () => void;
  redo: () => void;

  getSelectedLayer: () => Layer | null;
  getCanvasState: () => CanvasState;
  loadCanvasState: (state: CanvasState) => void;

  markSaved: () => void;
}

function saveHistory(set: any, get: any, mutate: (layers: Layer[]) => Layer[]) {
  const { layers, past } = get();
  const newLayers = mutate([...layers]);
  set({ layers: newLayers, past: [...past, layers], future: [], isDirty: true });
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  layers: [],
  width: 1200,
  height: 628,
  backgroundColor: '#ffffff',
  selectedId: null,
  hoveredId: null,
  past: [],
  future: [],
  isDirty: false,

  setCanvasSize: (width, height) => set({ width, height }),
  setBackgroundColor: (color) => set({ backgroundColor: color, isDirty: true }),

  loadLayers: (layers) => set({ layers, past: [], future: [] }),

  setSelectedId: (id) => set({ selectedId: id }),
  setHoveredId: (id) => set({ hoveredId: id }),

  addLayer: (layerData) => {
    const { layers } = get();
    const id = generateId();
    const newLayer = { ...layerData, id, zIndex: layers.length } as Layer;
    saveHistory(set, get, (prev) => [...prev, newLayer]);
    return id;
  },

  updateLayer: (id, patch) => {
    saveHistory(set, get, (prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } as Layer : l))
    );
  },

  deleteLayer: (id) => {
    saveHistory(set, get, (prev) => prev.filter((l) => l.id !== id));
    if (get().selectedId === id) set({ selectedId: null });
  },

  duplicateLayer: (id) => {
    const { layers } = get();
    const original = layers.find((l) => l.id === id);
    if (!original) return;
    const clone: Layer = { ...original, id: generateId(), x: original.x + 20, y: original.y + 20, zIndex: layers.length };
    saveHistory(set, get, (prev) => [...prev, clone]);
  },

  reorderLayer: (id, direction) => {
    saveHistory(set, get, (prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'up' && idx < next.length - 1) {
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      } else if (direction === 'down' && idx > 0) {
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      }
      return next.map((l, i) => ({ ...l, zIndex: i }));
    });
  },

  toggleVisibility: (id) => {
    saveHistory(set, get, (prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  },

  toggleLock: (id) => {
    saveHistory(set, get, (prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  },

  undo: () => {
    const { past, layers, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({
      layers: previous,
      past: past.slice(0, -1),
      future: [layers, ...future],
      isDirty: true,
    });
  },

  redo: () => {
    const { past, layers, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      layers: next,
      past: [...past, layers],
      future: future.slice(1),
      isDirty: true,
    });
  },

  getSelectedLayer: () => {
    const { layers, selectedId } = get();
    return layers.find((l) => l.id === selectedId) ?? null;
  },

  getCanvasState: () => {
    const { layers, width, height, backgroundColor } = get();
    return { layers, width, height, backgroundColor };
  },

  loadCanvasState: (state) => {
    set({
      layers: state.layers || [],
      width: state.width || 1200,
      height: state.height || 628,
      backgroundColor: state.backgroundColor || '#ffffff',
      past: [],
      future: [],
      isDirty: false,
    });
  },

  markSaved: () => set({ isDirty: false }),
}));

// Default layer factories
export function createTextLayer(overrides?: Partial<TextLayer>): Omit<TextLayer, 'id' | 'zIndex'> {
  return {
    type: 'text',
    name: 'Text Layer',
    x: 100,
    y: 100,
    width: 400,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    text: 'Your text here',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 32,
    color: '#000000',
    align: 'left',
    verticalAlign: 'top',
    lineHeight: 1.2,
    letterSpacing: 0,
    direction: 'ltr',
    italic: false,
    underline: false,
    shadow: { enabled: false, color: '#000000', blur: 4, offsetX: 2, offsetY: 2 },
    stroke: { enabled: false, color: '#000000', width: 1 },
    ...overrides,
  };
}

export function createBackgroundLayer(overrides?: Partial<BackgroundLayer>): Omit<BackgroundLayer, 'id' | 'zIndex'> {
  return {
    type: 'background',
    name: 'Background',
    x: 0,
    y: 0,
    width: 1200,
    height: 628,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#1a1a2e',
    ...overrides,
  };
}

export function createImageLayer(overrides?: Partial<ImageLayer>): Omit<ImageLayer, 'id' | 'zIndex'> {
  return {
    type: 'image',
    name: 'Image Layer',
    x: 50,
    y: 50,
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    imageUrl: '',
    fit: 'contain',
    ...overrides,
  };
}

