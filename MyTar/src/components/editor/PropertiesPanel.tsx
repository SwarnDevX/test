'use client';

import { useCanvasStore } from '@/store/canvasStore';
import { TextLayer, ImageLayer, ShapeLayer } from '@/types/canvas';
import { HexColorPicker } from 'react-colorful';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { GOOGLE_FONTS, loadGoogleFont } from '@/lib/fonts';

function ColorInput({ value, onChange, label }: { value: string; onChange: (c: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs hover:bg-white/10"
      >
        <div className="w-5 h-5 rounded border border-white/20" style={{ background: value }} />
        <span className="font-mono">{value}</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0">
          <div className="p-2 bg-slate-800 border border-white/10 rounded-xl shadow-xl">
            <HexColorPicker color={value} onChange={onChange} />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full mt-2 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs font-mono"
            />
          </div>
          <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange, min, max, step = 1, unit = '' }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        />
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function TextProperties({ layer }: { layer: TextLayer }) {
  const { updateLayer } = useCanvasStore();
  const update = (patch: Partial<TextLayer>) => updateLayer(layer.id, patch as any);

  function handleFontChange(font: string) {
    loadGoogleFont(font);
    update({ fontFamily: font });
  }

  return (
    <div className="space-y-4">
      {/* Content */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Text Content</label>
        <textarea
          value={layer.text}
          onChange={(e) => update({ text: e.target.value })}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 resize-none"
        />
      </div>

      {/* Font */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Font Family</label>
        <select
          value={layer.fontFamily}
          onChange={(e) => handleFontChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        >
          {GOOGLE_FONTS.map((f) => <option key={f} value={f} className="bg-slate-800" style={{ fontFamily: f }}>{f}</option>)}
        </select>
      </div>

      {/* Size & Weight */}
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Size" value={layer.fontSize} onChange={(v) => update({ fontSize: v })} min={8} max={300} />
        <div>
          <label className="block text-xs text-slate-400 mb-1">Weight</label>
          <select
            value={layer.fontWeight}
            onChange={(e) => update({ fontWeight: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
          >
            {['100','200','300','400','500','600','700','800','900'].map((w) => (
              <option key={w} value={w} className="bg-slate-800">{w}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Color */}
      <ColorInput label="Color" value={layer.color} onChange={(c) => update({ color: c })} />

      {/* Align */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Alignment</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => update({ align: a })}
              className={cn('flex-1 py-1.5 text-xs rounded border', layer.align === a ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/10 hover:bg-white/5')}
            >
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Line height & letter spacing */}
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Line Height" value={layer.lineHeight} onChange={(v) => update({ lineHeight: v })} min={0.5} max={5} step={0.1} />
        <NumberInput label="Letter Spacing" value={layer.letterSpacing} onChange={(v) => update({ letterSpacing: v })} min={-10} max={100} />
      </div>

      {/* Style toggles */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Style</label>
        <div className="flex gap-2">
          <button
            onClick={() => update({ italic: !layer.italic })}
            className={cn('px-3 py-1.5 text-xs rounded border italic', layer.italic ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/10')}
          >
            I
          </button>
          <button
            onClick={() => update({ underline: !layer.underline })}
            className={cn('px-3 py-1.5 text-xs rounded border underline', layer.underline ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/10')}
          >
            U
          </button>
        </div>
      </div>

      {/* Direction (RTL/LTR) */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Text Direction</label>
        <div className="flex gap-1">
          {(['ltr', 'rtl'] as const).map((d) => (
            <button
              key={d}
              onClick={() => update({ direction: d })}
              className={cn('flex-1 py-1.5 text-xs rounded border', layer.direction === d ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-white/10')}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Shadow */}
      <div className="border border-white/10 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Shadow</span>
          <button
            onClick={() => update({ shadow: { ...layer.shadow, enabled: !layer.shadow.enabled } })}
            className={cn('text-xs px-2 py-0.5 rounded', layer.shadow.enabled ? 'bg-blue-600 text-white' : 'bg-white/10')}
          >
            {layer.shadow.enabled ? 'On' : 'Off'}
          </button>
        </div>
        {layer.shadow.enabled && (
          <>
            <ColorInput label="Shadow Color" value={layer.shadow.color} onChange={(c) => update({ shadow: { ...layer.shadow, color: c } })} />
            <div className="grid grid-cols-3 gap-1.5">
              <NumberInput label="Blur" value={layer.shadow.blur} onChange={(v) => update({ shadow: { ...layer.shadow, blur: v } })} min={0} max={50} />
              <NumberInput label="X" value={layer.shadow.offsetX} onChange={(v) => update({ shadow: { ...layer.shadow, offsetX: v } })} min={-50} max={50} />
              <NumberInput label="Y" value={layer.shadow.offsetY} onChange={(v) => update({ shadow: { ...layer.shadow, offsetY: v } })} min={-50} max={50} />
            </div>
          </>
        )}
      </div>

      {/* Stroke */}
      <div className="border border-white/10 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Stroke</span>
          <button
            onClick={() => update({ stroke: { ...layer.stroke, enabled: !layer.stroke.enabled } })}
            className={cn('text-xs px-2 py-0.5 rounded', layer.stroke.enabled ? 'bg-blue-600 text-white' : 'bg-white/10')}
          >
            {layer.stroke.enabled ? 'On' : 'Off'}
          </button>
        </div>
        {layer.stroke.enabled && (
          <div className="grid grid-cols-2 gap-2">
            <ColorInput label="Stroke Color" value={layer.stroke.color} onChange={(c) => update({ stroke: { ...layer.stroke, color: c } })} />
            <NumberInput label="Width" value={layer.stroke.width} onChange={(v) => update({ stroke: { ...layer.stroke, width: v } })} min={0} max={20} />
          </div>
        )}
      </div>
    </div>
  );
}

function ImageProperties({ layer }: { layer: ImageLayer }) {
  const { updateLayer } = useCanvasStore();
  const update = (patch: Partial<ImageLayer>) => updateLayer(layer.id, patch as any);

  return (
    <div className="space-y-3">
      <NumberInput label="Opacity" value={Math.round(layer.opacity * 100)} onChange={(v) => update({ opacity: v / 100 })} min={0} max={100} unit="%" />
      <NumberInput label="Rotation" value={layer.rotation} onChange={(v) => update({ rotation: v })} min={-360} max={360} unit="°" />
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="Width" value={layer.width} onChange={(v) => update({ width: v })} min={10} />
        <NumberInput label="Height" value={layer.height} onChange={(v) => update({ height: v })} min={10} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="X" value={layer.x} onChange={(v) => update({ x: v })} />
        <NumberInput label="Y" value={layer.y} onChange={(v) => update({ y: v })} />
      </div>
    </div>
  );
}

function CommonProperties({ layer }: { layer: any }) {
  const { updateLayer } = useCanvasStore();
  const update = (patch: any) => updateLayer(layer.id, patch);

  return (
    <div className="space-y-3 pb-3 mb-3 border-b border-white/10">
      <div>
        <label className="block text-xs text-slate-400 mb-1">Layer Name</label>
        <input
          value={layer.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
        />
      </div>
      <NumberInput label="Opacity" value={Math.round(layer.opacity * 100)} onChange={(v) => update({ opacity: v / 100 })} min={0} max={100} unit="%" />
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label="X" value={Math.round(layer.x)} onChange={(v) => update({ x: v })} />
        <NumberInput label="Y" value={Math.round(layer.y)} onChange={(v) => update({ y: v })} />
      </div>
      <NumberInput label="Rotation" value={layer.rotation} onChange={(v) => update({ rotation: v })} min={-360} max={360} unit="°" />
    </div>
  );
}

export default function PropertiesPanel() {
  const { getSelectedLayer, width, height, backgroundColor, setBackgroundColor } = useCanvasStore();
  const selected = getSelectedLayer();

  if (!selected) {
    return (
      <div className="w-64 bg-slate-900 border-l border-white/10 p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Properties</div>
        {/* Canvas properties */}
        <div className="space-y-3">
          <div className="text-xs text-slate-500 mb-2">Canvas</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>Width: {width}px</div>
            <div>Height: {height}px</div>
          </div>
          <ColorInput label="Background Color" value={backgroundColor} onChange={setBackgroundColor} />
        </div>
        <div className="mt-8 text-center text-slate-600 text-xs">
          Select a layer to edit its properties
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-slate-900 border-l border-white/10 flex flex-col">
      <div className="px-3 py-2.5 border-b border-white/10">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Properties</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <CommonProperties layer={selected} />
        {selected.type === 'text' && <TextProperties layer={selected as TextLayer} />}
        {selected.type === 'image' && <ImageProperties layer={selected as ImageLayer} />}
      </div>
    </div>
  );
}

