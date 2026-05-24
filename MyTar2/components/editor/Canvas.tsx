'use client';
import { useRef, useEffect } from 'react';
import Konva from 'konva';
import toast from 'react-hot-toast';
import { useEditorStore } from '@/lib/store';
import { Layer as LayerType, BackgroundLayer, TextLayer, LogoLayer, AssetLayer } from '@/lib/types';
import { downloadDataUrl } from '@/lib/utils';
import AIPanel from './AIPanel';

const imgCache = new Map<string, HTMLImageElement>();

function loadImg(url: string, cb: (img: HTMLImageElement) => void) {
  if (imgCache.has(url)) { cb(imgCache.get(url)!); return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => { imgCache.set(url, img); cb(img); };
  img.onerror = () => {};
  img.src = url;
}

export default function CanvasEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef     = useRef<Konva.Stage | null>(null);
  const kLayerRef    = useRef<Konva.Layer | null>(null);
  const trRef        = useRef<Konva.Transformer | null>(null);
  const nodes        = useRef(new Map<string, Konva.Node>());

  const { layers, selectedLayerId, format, zoom, activePanel, setActivePanel } = useEditorStore();

  // Init stage once
  useEffect(() => {
    if (!containerRef.current) return;
    const stage = new Konva.Stage({ container: containerRef.current, width: format.width, height: format.height });
    const kl = new Konva.Layer();
    stage.add(kl);
    const tr = new Konva.Transformer({ borderStroke: '#8b5cf6', anchorStroke: '#8b5cf6', anchorFill: '#fff', anchorSize: 8 });
    kl.add(tr);
    stage.on('click tap', (e) => { if (e.target === stage) useEditorStore.getState().selectLayer(null); });
    stageRef.current = stage;
    kLayerRef.current = kl;
    trRef.current = tr;
    return () => {
      stage.destroy();
      stageRef.current = null; kLayerRef.current = null; trRef.current = null;
      nodes.current.clear();
    };
  }, []); // eslint-disable-line

  // Resize
  useEffect(() => {
    stageRef.current?.setAttrs({ width: format.width * zoom, height: format.height * zoom, scaleX: zoom, scaleY: zoom });
    stageRef.current?.batchDraw();
  }, [format, zoom]);

  // Sync layers → Konva
  useEffect(() => {
    const kl = kLayerRef.current;
    const tr = trRef.current;
    if (!kl || !tr) return;

    // Remove deleted nodes
    const ids = new Set(layers.map(l => l.id));
    nodes.current.forEach((n, id) => { if (!ids.has(id)) { n.destroy(); nodes.current.delete(id); } });

    // Create / update each layer
    layers.forEach(l => {
      if (l.type === 'background') syncBg(l as BackgroundLayer, kl);
      else if (l.type === 'text')  syncText(l as TextLayer, kl);
      else                          syncImgLayer(l as LogoLayer | AssetLayer, kl);
    });

    // Z-order: layers[0] = top of stack
    [...layers].reverse().forEach(l => nodes.current.get(l.id)?.moveToTop());
    tr.moveToTop();

    // Transformer
    const selLayer = layers.find(l => l.id === selectedLayerId);
    const selNode  = selectedLayerId ? nodes.current.get(selectedLayerId) : null;
    if (selNode && selLayer && !(selLayer as unknown as { locked?: boolean }).locked) {
      tr.nodes([selNode]);
      tr.enabledAnchors(selLayer.type === 'text'
        ? ['middle-left', 'middle-right']
        : ['top-left', 'top-center', 'top-right', 'middle-right', 'bottom-right', 'bottom-center', 'bottom-left', 'middle-left']);
    } else {
      tr.nodes([]);
    }
    kl.batchDraw();
  }, [layers, selectedLayerId]); // eslint-disable-line

  // Export
  useEffect(() => {
    const handler = () => {
      if (!stageRef.current) return;
      downloadDataUrl(stageRef.current.toDataURL({ pixelRatio: 2, mimeType: 'image/png' }), 'ad-creative.png');
      toast.success('Image exported!');
    };
    window.addEventListener('editor:export', handler);
    return () => window.removeEventListener('editor:export', handler);
  }, []);

  // ── sync helpers (function declarations are hoisted) ──────────

  function syncBg(bg: BackgroundLayer, kl: Konva.Layer) {
    if (bg.imageUrl) {
      loadImg(bg.imageUrl, (img) => {
        if (!useEditorStore.getState().layers.find(x => x.id === bg.id)) return;
        let n = nodes.current.get(bg.id);
        if (!(n instanceof Konva.Image)) {
          n?.destroy();
          const ki = new Konva.Image({ id: bg.id, x: 0, y: 0, image: img, width: bg.width, height: bg.height, visible: bg.visible });
          ki.on('click tap', () => useEditorStore.getState().selectLayer(bg.id));
          kl.add(ki); nodes.current.set(bg.id, ki); n = ki;
        } else {
          (n as Konva.Image).setAttrs({ image: img, width: bg.width, height: bg.height, visible: bg.visible });
        }
        n.moveToBottom(); kLayerRef.current?.batchDraw();
      });
      return;
    }
    let n = nodes.current.get(bg.id);
    if (!(n instanceof Konva.Rect)) {
      n?.destroy();
      const r = new Konva.Rect({ id: bg.id, x: 0, y: 0 });
      r.on('click tap', () => useEditorStore.getState().selectLayer(bg.id));
      kl.add(r); nodes.current.set(bg.id, r); n = r;
    }
    const rect = n as Konva.Rect;
    if (bg.useGradient) {
      rect.fill('');
      rect.setAttrs({ width: bg.width, height: bg.height, visible: bg.visible, fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: bg.width, y: bg.height }, fillLinearGradientColorStops: [0, bg.gradientFrom, 1, bg.gradientTo] });
    } else {
      rect.setAttrs({ width: bg.width, height: bg.height, visible: bg.visible, fill: bg.color });
      rect.fillLinearGradientColorStops([]);
    }
  }

  function syncText(t: TextLayer, kl: Konva.Layer) {
    let n = nodes.current.get(t.id) as Konva.Text | undefined;
    if (!n) {
      n = new Konva.Text({ id: t.id });
      n.on('click tap', () => useEditorStore.getState().selectLayer(t.id));
      n.on('dragend', e => useEditorStore.getState().updateLayer(t.id, { x: e.target.x(), y: e.target.y() }));
      n.on('transformend', e => {
        const nd = e.target as Konva.Text;
        useEditorStore.getState().updateLayer(t.id, { x: nd.x(), y: nd.y(), width: Math.max(20, nd.width() * nd.scaleX()), rotation: nd.rotation() });
        nd.scaleX(1); nd.scaleY(1);
      });
      kl.add(n); nodes.current.set(t.id, n);
    }
    n.setAttrs({
      text: t.content, x: t.x, y: t.y, width: t.width,
      fontSize: t.fontSize, fontFamily: t.fontFamily,
      fontStyle: [t.italic ? 'italic' : '', t.fontWeight].filter(Boolean).join(' '),
      textDecoration: t.underline ? 'underline' : '',
      fill: t.color, align: t.alignment, lineHeight: t.lineHeight,
      letterSpacing: t.letterSpacing, opacity: t.opacity, rotation: t.rotation,
      visible: t.visible, draggable: !t.locked,
      ...(t.shadow?.enabled ? { shadowEnabled: true, shadowColor: t.shadow.color, shadowBlur: t.shadow.blur, shadowOffsetX: t.shadow.offsetX, shadowOffsetY: t.shadow.offsetY } : { shadowEnabled: false }),
      ...(t.stroke?.enabled ? { stroke: t.stroke.color, strokeWidth: t.stroke.width } : { stroke: '', strokeWidth: 0 }),
    });
  }

  function syncImgLayer(l: LogoLayer | AssetLayer, kl: Konva.Layer) {
    if (!l.imageUrl) return;
    const id = l.id;
    loadImg(l.imageUrl, (img) => {
      const latest = useEditorStore.getState().layers.find(x => x.id === id) as typeof l | undefined;
      if (!latest) return;
      let n = nodes.current.get(id) as Konva.Image | undefined;
      if (!n) {
        n = new Konva.Image({ id, image: img });
        n.on('click tap', () => useEditorStore.getState().selectLayer(id));
        n.on('dragend', e => useEditorStore.getState().updateLayer(id, { x: e.target.x(), y: e.target.y() }));
        n.on('transformend', e => {
          const nd = e.target as Konva.Image;
          useEditorStore.getState().updateLayer(id, { x: nd.x(), y: nd.y(), width: nd.width() * nd.scaleX(), height: nd.height() * nd.scaleY(), rotation: nd.rotation() });
          nd.scaleX(1); nd.scaleY(1);
        });
        kl.add(n); nodes.current.set(id, n);
      }
      n.setAttrs({ image: img, x: latest.x, y: latest.y, width: latest.width, height: latest.height, rotation: latest.rotation, opacity: latest.opacity, visible: latest.visible, draggable: !latest.locked });
      kLayerRef.current?.batchDraw();
    });
  }

  const stageW = format.width * zoom;
  const stageH = format.height * zoom;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 10 }}>
        <button
          onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}
          style={{ padding: '8px 14px', borderRadius: 10, background: activePanel === 'ai' ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#111128', border: '1px solid', borderColor: activePanel === 'ai' ? 'transparent' : '#2a2a55', color: activePanel === 'ai' ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}
        >
          ✨ AI Generate
        </button>
      </div>

      <div className="checkerboard" style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div ref={containerRef} style={{ width: stageW, height: stageH, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: '#475569', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {format.width} × {format.height} px — {format.name}
          </div>
        </div>
      </div>

      {activePanel === 'ai' && (
        <div style={{ position: 'absolute', left: 0, bottom: 56, zIndex: 20, width: 360 }}>
          <AIPanel onClose={() => setActivePanel(null)} />
        </div>
      )}
    </div>
  );
}
