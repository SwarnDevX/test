import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deductCredits, checkCredits } from '@/lib/credits';
import { CREDIT_COSTS } from '@/lib/stripe';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const schema = z.object({
  canvasWidth: z.number().int(),
  canvasHeight: z.number().int(),
  productType: z.string(),
  hasLogo: z.boolean().optional(),
  hasBackground: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { canvasWidth, canvasHeight, productType, hasLogo, hasBackground } = parsed.data;

  const hasCredits = await checkCredits(session.user.id, CREDIT_COSTS.LAYOUT);
  if (!hasCredits) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });

  const prompt = `Generate a layout suggestion for a ${canvasWidth}x${canvasHeight}px static ad creative for: ${productType}.
${hasBackground ? 'There is already a background image.' : ''}
${hasLogo ? 'There is a logo to place.' : ''}

Return JSON with a "layers" array. Each layer: { type: "text"|"image"|"shape", name: string, x: number, y: number, width: number, height: number, content?: string, fontSize?: number, color?: string }.
Position elements for visual hierarchy and impact. All values must be within canvas bounds.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  await deductCredits(session.user.id, CREDIT_COSTS.LAYOUT);

  return NextResponse.json(result);
}

