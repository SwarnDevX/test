// Canvas Layer Types

export type LayerType = 'background' | 'text' | 'image' | 'shape';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export interface BackgroundLayer extends BaseLayer {
  type: 'background';
  fill?: string;
  imageUrl?: string;
  imageId?: string; // GeneratedAsset id
}

export interface TextShadow {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface TextStroke {
  enabled: boolean;
  color: string;
  width: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  direction: 'ltr' | 'rtl';
  shadow: TextShadow;
  stroke: TextStroke;
  italic: boolean;
  underline: boolean;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  imageUrl: string;
  assetId?: string;
  isLogo?: boolean;
  fit?: 'contain' | 'cover' | 'fill';
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: 'rect' | 'circle' | 'triangle';
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius?: number;
}

export type Layer = BackgroundLayer | TextLayer | ImageLayer | ShapeLayer;

export interface CanvasState {
  layers: Layer[];
  width: number;
  height: number;
  backgroundColor: string;
}

export interface CanvasFormat {
  name: string;
  width: number;
  height: number;
  description: string;
}

export const AD_FORMATS: CanvasFormat[] = [
  { name: 'Facebook Feed', width: 1200, height: 628, description: '1200 × 628' },
  { name: 'Instagram Square', width: 1080, height: 1080, description: '1080 × 1080' },
  { name: 'Instagram Story', width: 1080, height: 1920, description: '1080 × 1920' },
  { name: 'Twitter Card', width: 1200, height: 675, description: '1200 × 675' },
  { name: 'LinkedIn Banner', width: 1200, height: 627, description: '1200 × 627' },
  { name: 'Google Display', width: 728, height: 90, description: '728 × 90' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, description: '1280 × 720' },
];

