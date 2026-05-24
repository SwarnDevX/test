export interface StylePreset {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  thumbnail?: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'none',
    name: 'None',
    description: 'Use your prompt as-is',
    promptSuffix: '',
  },
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'High-fidelity photo-like quality',
    promptSuffix: ', photorealistic, high resolution, professional photography, 8k',
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Smooth color gradient backgrounds',
    promptSuffix: ', smooth gradient, clean background, minimal, modern design',
  },
  {
    id: 'abstract',
    name: 'Abstract',
    description: 'Creative abstract patterns',
    promptSuffix: ', abstract art, creative, colorful, dynamic composition',
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    description: 'Premium dark aesthetic',
    promptSuffix: ', dark background, luxury aesthetic, premium quality, moody lighting, elegant',
  },
  {
    id: 'flat-design',
    name: 'Flat Design',
    description: 'Clean flat illustration style',
    promptSuffix: ', flat design, illustration, clean lines, minimal, vector style',
  },
  {
    id: 'bokeh',
    name: 'Bokeh',
    description: 'Soft blurred background effect',
    promptSuffix: ', bokeh background, soft focus, shallow depth of field, blurred lights',
  },
  {
    id: 'geometric',
    name: 'Geometric',
    description: 'Bold geometric shapes',
    promptSuffix: ', geometric shapes, bold colors, modern, sharp edges, structured composition',
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    description: 'Vibrant neon colors',
    promptSuffix: ', neon lights, glowing effects, dark background, vibrant neon colors, cyberpunk aesthetic',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft watercolor texture',
    promptSuffix: ', watercolor texture, soft colors, artistic, hand-painted look',
  },
];

export function applyStylePreset(prompt: string, presetId: string): string {
  const preset = STYLE_PRESETS.find((p) => p.id === presetId);
  if (!preset || !preset.promptSuffix) return prompt;
  return `${prompt.trim()}${preset.promptSuffix}`;
}

