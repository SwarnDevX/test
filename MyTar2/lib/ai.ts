import Anthropic from '@anthropic-ai/sdk';
import { AIGenerateCopyRequest, AIGeneratedCopy, GRADIENT_PRESETS } from './types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STOCK_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1080&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579567761406-4684ee0c75b6?w=1080&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1080&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488229297570-58520851e868?w=1080&h=1080&fit=crop&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&h=1080&fit=crop&q=80',
];

export async function generateBackgroundImage(
  prompt: string,
  style: string,
  width: number,
  height: number
): Promise<{ type: 'url' | 'gradient'; value: string; gradientFrom?: string; gradientTo?: string }> {
  if (!process.env.REPLICATE_API_TOKEN) {
    if (style === 'gradient') {
      const preset = GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)];
      return { type: 'gradient', value: preset.name, gradientFrom: preset.from, gradientTo: preset.to };
    }
    const url = STOCK_BACKGROUNDS[Math.floor(Math.random() * STOCK_BACKGROUNDS.length)];
    return { type: 'url', value: url };
  }

  try {
    const { default: Replicate } = await import('replicate');
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      { input: { prompt: `${prompt}, ${style} style, professional advertisement background, high quality`, width, height, num_inference_steps: 25 } }
    );
    const url = Array.isArray(output) ? (output[0] as string) : String(output);
    return { type: 'url', value: url };
  } catch {
    const url = STOCK_BACKGROUNDS[Math.floor(Math.random() * STOCK_BACKGROUNDS.length)];
    return { type: 'url', value: url };
  }
}

export async function generateAdCopy(request: AIGenerateCopyRequest): Promise<AIGeneratedCopy> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      headline: `${request.productName} — Reimagined`,
      tagline: 'The future is here today',
      cta: request.callToAction || 'Get Started',
      bodyText: 'Experience the difference that quality makes.',
    };
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Generate compelling ad copy for:
Product/Brand: ${request.productName}
Industry: ${request.industry}
Tone: ${request.tone}
Call to Action: ${request.callToAction}

Return ONLY a valid JSON object with exactly these fields:
{ "headline": "max 8 words", "tagline": "max 12 words", "cta": "max 4 words", "bodyText": "max 20 words" }`,
    }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  try {
    const json = text.match(/\{[\s\S]*\}/)?.[0] ?? text;
    return JSON.parse(json) as AIGeneratedCopy;
  } catch {
    return {
      headline: `${request.productName} — Reimagined`,
      tagline: 'Crafted for those who demand more',
      cta: request.callToAction || 'Get Started',
      bodyText: 'Elevate your experience with premium quality.',
    };
  }
}

export async function generateLayoutSuggestions() {
  return [
    { id: 'centered', name: 'Centered Hero', description: 'Bold headline centered with logo above', preview: 'center' },
    { id: 'left-align', name: 'Left-Aligned', description: 'Text on left, visual on right', preview: 'left' },
    { id: 'bottom-strip', name: 'Bottom Strip', description: 'Full background with text overlay at bottom', preview: 'bottom' },
    { id: 'split', name: 'Split Screen', description: 'Color split with contrasting text blocks', preview: 'split' },
    { id: 'minimal', name: 'Minimalist', description: 'Clean negative space with bold single element', preview: 'minimal' },
  ];
}
