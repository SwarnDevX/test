export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'business';
export type LayerType = 'background' | 'text' | 'logo' | 'asset';

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

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface BackgroundLayer extends BaseLayer {
  type: 'background';
  imageUrl: string | null;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  useGradient: boolean;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  shadow: TextShadow;
  stroke: TextStroke;
  isRTL: boolean;
  italic: boolean;
  underline: boolean;
}

export interface LogoLayer extends BaseLayer {
  type: 'logo';
  imageUrl: string;
}

export interface AssetLayer extends BaseLayer {
  type: 'asset';
  imageUrl: string;
}

export type Layer = BackgroundLayer | TextLayer | LogoLayer | AssetLayer;

export interface AdFormat {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
}

export interface CanvasState {
  layers: Layer[];
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  credits: number;
  subscription: SubscriptionTier;
  avatar: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  userId: string;
  format: string;
  formatName: string;
  canvasState: CanvasState;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandKit {
  id: string;
  name: string;
  userId: string;
  colors: string[];
  fonts: string[];
  logos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AIGenerateCopyRequest {
  productName: string;
  industry: string;
  tone: string;
  callToAction: string;
}

export interface AIGeneratedCopy {
  headline: string;
  tagline: string;
  cta: string;
  bodyText: string;
}

export const AD_FORMATS: AdFormat[] = [
  { id: 'square', name: 'Square', category: 'Universal', width: 1080, height: 1080 },
  { id: 'landscape', name: 'Landscape', category: 'Universal', width: 1200, height: 628 },
  { id: 'portrait', name: 'Portrait', category: 'Universal', width: 1080, height: 1350 },
  { id: 'story', name: 'Story / Reel', category: 'Social', width: 1080, height: 1920 },
  { id: 'fb-feed', name: 'Facebook Feed', category: 'Facebook', width: 1200, height: 628 },
  { id: 'fb-story', name: 'Facebook Story', category: 'Facebook', width: 1080, height: 1920 },
  { id: 'ig-feed', name: 'Instagram Feed', category: 'Instagram', width: 1080, height: 1080 },
  { id: 'ig-story', name: 'Instagram Story', category: 'Instagram', width: 1080, height: 1920 },
  { id: 'twitter-post', name: 'Twitter / X Post', category: 'Twitter', width: 1200, height: 675 },
  { id: 'linkedin-post', name: 'LinkedIn Post', category: 'LinkedIn', width: 1200, height: 627 },
  { id: 'display-728', name: 'Leaderboard 728×90', category: 'Display', width: 728, height: 90 },
  { id: 'display-300', name: 'Rectangle 300×250', category: 'Display', width: 300, height: 250 },
  { id: 'display-160', name: 'Skyscraper 160×600', category: 'Display', width: 160, height: 600 },
];

export const SUBSCRIPTION_TIERS = {
  free: { name: 'Free', credits: 10, price: 0 },
  starter: { name: 'Starter', credits: 100, price: 9.99 },
  pro: { name: 'Pro', credits: 500, price: 29.99 },
  business: { name: 'Business', credits: 2000, price: 99.99 },
};

export const CREDIT_COSTS = {
  'generate-background': 2,
  'generate-copy': 1,
  'generate-layout': 1,
  export: 0,
} as const;

export const WEB_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Raleway', 'Oswald', 'Merriweather', 'Playfair Display', 'Ubuntu',
  'Nunito', 'Quicksand', 'Bebas Neue', 'Pacifico', 'Anton',
  'Dancing Script', 'Lobster', 'Righteous', 'Abril Fatface',
  'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana',
];

export const GRADIENT_PRESETS = [
  { name: 'Cosmic', from: '#667eea', to: '#764ba2', angle: 135 },
  { name: 'Sunset', from: '#f093fb', to: '#f5576c', angle: 135 },
  { name: 'Ocean', from: '#4facfe', to: '#00f2fe', angle: 135 },
  { name: 'Forest', from: '#43e97b', to: '#38f9d7', angle: 135 },
  { name: 'Rose', from: '#fa709a', to: '#fee140', angle: 135 },
  { name: 'Deep', from: '#30cfd0', to: '#330867', angle: 135 },
  { name: 'Dusk', from: '#a18cd1', to: '#fbc2eb', angle: 135 },
  { name: 'Peach', from: '#ffecd2', to: '#fcb69f', angle: 135 },
  { name: 'Night', from: '#0f0c29', to: '#302b63', angle: 135 },
  { name: 'Fire', from: '#f12711', to: '#f5af19', angle: 135 },
];
