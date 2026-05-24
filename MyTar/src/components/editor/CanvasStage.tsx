'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { useCanvasStore } from '@/store/canvasStore';
import { Layer as LayerType, TextLayer, ImageLayer, BackgroundLayer, ShapeLayer } from '@/types/canvas';

// Background Layer
function BackgroundLayerComponent({ layer }: { layer: BackgroundLayer }) {
  const [image] = useImage(layer.imageUrl || '');
  const { selectedId, setSelectedId } = useCanvasStore();
  const isSelected = selectedId === layer.id;

  if (!layer.visible) return null;

  return (
    <>
      {layer.imageUrl && image ? (
        <KonvaImage
          image={image}
          x={layer.x}
          y={layer.y}
          width={layer.width}
          height={layer.height}
          opacity={layer.opacity}
          onClick={() => setSelectedId(layer.id)}
          onTap={() => setSelectedId(layer.id)}
        />
      ) : (
        <Rect
          x={layer.x}
          y={layer.y}
          width={layer.width}
          height={layer.height}
          fill={layer.fill || '#1a1a2e'}
          opacity={layer.opacity}
          onClick={() => setSelectedId(layer.id)}
          onTap={() => setSelectedId(layer.id)}
        />
      )}
    </>
  );
}

// Text Layer
function TextLayerComponent({ layer, stageScale }: { layer: TextLayer; stageScale: number }) {
  const { selectedId, setSelectedId, updateLayer } = useCanvasStore();
  const isSelected = selectedId === layer.id;
  const nodeRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!layer.visible) return null;

  const shadowConfig = layer.shadow?.enabled
    ? { shadowColor: layer.shadow.color, shadowBlur: layer.shadow.blur, shadowOffsetX: layer.shadow.offsetX, shadowOffsetY: layer.shadow.offsetY, shadowEnabled: true }
    : { shadowEnabled: false };

  const strokeConfig = layer.stroke?.enabled
    ? { stroke: layer.stroke.color, strokeWidth: layer.stroke.width }
    : {};

  return (
    <>
      <Text
        ref={nodeRef}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        text={layer.text}
        fontSize={layer.fontSize}
        fontFamily={layer.fontFamily}
        fontStyle={`${layer.italic ? 'italic' : 'normal'} ${layer.fontWeight}`}
        textDecoration={layer.underline ? 'underline' : ''}
        fill={layer.color}
        align={layer.align}
        lineHeight={layer.lineHeight}
        letterSpacing={layer.letterSpacing}
        opacity={layer.opacity}
        rotation={layer.rotation}
        draggable={!layer.locked}
        {...shadowConfig}
        {...strokeConfig}
        onClick={() => setSelectedId(layer.id)}
        onTap={() => setSelectedId(layer.id)}
        onDragEnd={(e) => {
          updateLayer(layer.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = nodeRef.current!;
          updateLayer(layer.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(50, node.width() * node.scaleX()),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && !layer.locked && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 50 ? oldBox : newBox)}
        />
      )}
    </>
  );
}

// Image Layer (logo/asset)
function ImageLayerComponent({ layer }: { layer: ImageLayer }) {
  const [image] = useImage(layer.imageUrl);
  const { selectedId, setSelectedId, updateLayer } = useCanvasStore();
  const isSelected = selectedId === layer.id;
  const nodeRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!layer.visible || !image) return null;

  return (
    <>
      <KonvaImage
        ref={nodeRef}
        image={image}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        rotation={layer.rotation}
        opacity={layer.opacity}
        draggable={!layer.locked}
        onClick={() => setSelectedId(layer.id)}
        onTap={() => setSelectedId(layer.id)}
        onDragEnd={(e) => {
          updateLayer(layer.id, { x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={(e) => {
          const node = nodeRef.current!;
          updateLayer(layer.id, {
            x: node.x(),
            y: node.y(),
            width: Math.round(node.width() * node.scaleX()),
            height: Math.round(node.height() * node.scaleY()),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && !layer.locked && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 || newBox.height < 20 ? oldBox : newBox)}
        />
      )}
    </>
  );
}

// Shape Layer
function ShapeLayerComponent({ layer }: { layer: ShapeLayer }) {
  const { selectedId, setSelectedId, updateLayer } = useCanvasStore();
  const isSelected = selectedId === layer.id;
  const nodeRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && nodeRef.current) {
      trRef.current.nodes([nodeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!layer.visible) return null;

  return (
    <>
      <Rect
        ref={nodeRef}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        rotation={layer.rotation}
        fill={layer.fill}
        stroke={layer.stroke}
        strokeWidth={layer.strokeWidth}
        cornerRadius={layer.cornerRadius}
        opacity={layer.opacity}
        draggable={!layer.locked}
        onClick={() => setSelectedId(layer.id)}
        onTap={() => setSelectedId(layer.id)}
        onDragEnd={(e) => updateLayer(layer.id, { x: e.target.x(), y: e.target.y() })}
        onTransformEnd={(e) => {
          const node = nodeRef.current!;
          updateLayer(layer.id, {
            x: node.x(),
            y: node.y(),
            width: Math.round(node.width() * node.scaleX()),
            height: Math.round(node.height() * node.scaleY()),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && !layer.locked && (
        <Transformer ref={trRef} />
      )}
    </>
  );
}

interface CanvasStageProps {
  containerWidth: number;
  containerHeight: number;
  stageRef: React.RefObject<Konva.Stage>;
}

export default function CanvasStage({ containerWidth, containerHeight, stageRef }: CanvasStageProps) {
  const { layers, width, height, backgroundColor, setSelectedId } = useCanvasStore();

  // Calculate scale to fit canvas in container
  const scaleX = containerWidth / width;
  const scaleY = containerHeight / height;
  const scale = Math.min(scaleX, scaleY, 1) * 0.9;
  const stageWidth = width * scale;
  const stageHeight = height * scale;
  const offsetX = (containerWidth - stageWidth) / 2;
  const offsetY = (containerHeight - stageHeight) / 2;

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      style={{ position: 'relative', width: containerWidth, height: containerHeight }}
      className="bg-slate-800"
    >
      {/* Canvas shadow/border */}
      <div
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          width: stageWidth,
          height: stageHeight,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          background: backgroundColor,
        }}
      />
      <Stage
        ref={stageRef}
        width={containerWidth}
        height={containerHeight}
        scaleX={scale}
        scaleY={scale}
        x={offsetX}
        y={offsetY}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) setSelectedId(null);
        }}
      >
        <Layer>
          {/* Canvas background */}
          <Rect x={0} y={0} width={width} height={height} fill={backgroundColor} />

          {sortedLayers.map((layer) => {
            switch (layer.type) {
              case 'background':
                return <BackgroundLayerComponent key={layer.id} layer={layer} />;
              case 'text':
                return <TextLayerComponent key={layer.id} layer={layer} stageScale={scale} />;
              case 'image':
                return <ImageLayerComponent key={layer.id} layer={layer} />;
              case 'shape':
                return <ShapeLayerComponent key={layer.id} layer={layer} />;
              default:
                return null;
            }
          })}
        </Layer>
      </Stage>
    </div>
  );
}

