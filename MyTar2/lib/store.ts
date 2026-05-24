'use client';
import { create } from 'zustand';
import {
  Layer, BackgroundLayer, TextLayer, LogoLayer, AssetLayer,
  AdFormat, AD_FORMATS, TextShadow, TextStroke,
} from './types';
import { generateId } from './utils';

interface EditorStore {
  format: AdFormat;
  zoom: number;
  layers: Layer[];
  selectedLayerId: string | null;
  activePanel: 'ai' | 'layers' | 'brand' | 'export' | null;
  isGenerating: boolean;
  isSaving: boolean;
  isDirty: boolean;

  setFormat: (format: AdFormat) => void;
  setZoom: (zoom: number) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  selectLayer: (id: string | null) => void;
  moveLayerUp: (id: string) => void;
  moveLayerDown: (id: string) => void;
  duplicateLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  reorderLayers: (layers: Layer[]) => void;
  setActivePanel: (panel: 'ai' | 'layers' | 'brand' | 'export' | null) => void;
  setGenerating: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  setDirty: (v: boolean) => void;
  loadLayers: (layers: Layer[]) => void;
  resetCanvas: () => void;
  getSelectedLayer: () => Layer | null;
  getBackgroundLayer: () => BackgroundLayer | null;
}

function makeBackground(format: AdFormat): BackgroundLayer {
  return {
    id: generateId(), type: 'background', name: 'Background',
    visible: true, locked: false,
    x: 0, y: 0, width: format.width, height: format.height,
    rotation: 0, opacity: 1,
    imageUrl: null, color: '#1a1a2e',
    useGradient: true, gradientFrom: '#667eea', gradientTo: '#764ba2', gradientAngle: 135,
  };
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  format: AD_FORMATS[0],
  zoom: 0.45,
  layers: [makeBackground(AD_FORMATS[0])],
  selectedLayerId: null,
  activePanel: 'layers',
  isGenerating: false,
  isSaving: false,
  isDirty: false,

  setFormat: (format) => {
    const { layers } = get();
    set({
      format,
      layers: layers.map(l => l.type === 'background' ? { ...l, width: format.width, height: format.height } : l),
    });
  },
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),

  addLayer: (layer) => set(s => ({ layers: [...s.layers, layer], selectedLayerId: layer.id, isDirty: true })),

  removeLayer: (id) => set(s => ({
    layers: s.layers.filter(l => l.id !== id),
    selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
    isDirty: true,
  })),

  updateLayer: (id, updates) => set(s => ({
    layers: s.layers.map(l => l.id === id ? { ...l, ...updates } as Layer : l),
    isDirty: true,
  })),

  selectLayer: (id) => set({ selectedLayerId: id }),

  moveLayerUp: (id) => set(s => {
    const arr = [...s.layers];
    const i = arr.findIndex(l => l.id === id);
    if (i < arr.length - 1) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    return { layers: arr, isDirty: true };
  }),

  moveLayerDown: (id) => set(s => {
    const arr = [...s.layers];
    const i = arr.findIndex(l => l.id === id);
    if (i > 0) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
    return { layers: arr, isDirty: true };
  }),

  duplicateLayer: (id) => set(s => {
    const layer = s.layers.find(l => l.id === id);
    if (!layer) return s;
    const dup: Layer = { ...layer, id: generateId(), name: `${layer.name} Copy`, x: layer.x + 20, y: layer.y + 20 };
    const i = s.layers.findIndex(l => l.id === id);
    const arr = [...s.layers];
    arr.splice(i + 1, 0, dup);
    return { layers: arr, selectedLayerId: dup.id, isDirty: true };
  }),

  toggleLayerVisibility: (id) => set(s => ({
    layers: s.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l),
  })),

  toggleLayerLock: (id) => set(s => ({
    layers: s.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l),
  })),

  reorderLayers: (layers) => set({ layers, isDirty: true }),

  setActivePanel: (panel) => set({ activePanel: panel }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setSaving: (isSaving) => set({ isSaving }),
  setDirty: (isDirty) => set({ isDirty }),
  loadLayers: (layers) => set({ layers, isDirty: false }),
  resetCanvas: () => set(s => ({ layers: [makeBackground(s.format)], selectedLayerId: null, isDirty: false })),

  getSelectedLayer: () => {
    const { layers, selectedLayerId } = get();
    return layers.find(l => l.id === selectedLayerId) ?? null;
  },
  getBackgroundLayer: () => {
    const { layers } = get();
    return (layers.find(l => l.type === 'background') as BackgroundLayer) ?? null;
  },
}));

export function makeTextLayer(overrides?: Partial<TextLayer>): TextLayer {
  const defaultShadow: TextShadow = { enabled: false, color: '#000000', blur: 4, offsetX: 2, offsetY: 2 };
  const defaultStroke: TextStroke = { enabled: false, color: '#000000', width: 2 };
  return {
    id: generateId(), type: 'text', name: 'Text Layer',
    visible: true, locked: false,
    x: 80, y: 120, width: 500, height: 80,
    rotation: 0, opacity: 1,
    content: 'Your Text Here', fontFamily: 'Inter', fontWeight: '700',
    fontSize: 56, color: '#ffffff', alignment: 'center',
    lineHeight: 1.2, letterSpacing: 0,
    shadow: defaultShadow, stroke: defaultStroke,
    isRTL: false, italic: false, underline: false,
    ...overrides,
  };
}

export function makeLogoLayer(imageUrl: string): LogoLayer {
  return {
    id: generateId(), type: 'logo', name: 'Logo',
    visible: true, locked: false,
    x: 40, y: 40, width: 180, height: 80,
    rotation: 0, opacity: 1, imageUrl,
  };
}

export function makeAssetLayer(imageUrl: string): AssetLayer {
  return {
    id: generateId(), type: 'asset', name: 'Asset',
    visible: true, locked: false,
    x: 100, y: 100, width: 300, height: 300,
    rotation: 0, opacity: 1, imageUrl,
  };
}
