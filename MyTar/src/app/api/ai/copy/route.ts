import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deductCredits, checkCredits, InsufficientCreditsError } from '@/lib/credits';
import { CREDIT_COSTS } from '@/lib/stripe';
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const schema = z.object({
  productName: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  targetAudience: z.string().max(200).optional(),
  tone: z.enum(['professional', 'casual', 'exciting', 'luxury', 'urgent', 'friendly']).default('professional'),
  format: z.string().optional(),
  variants: z.number().int().min(1).max(5).default(3),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await rateLimit(session.user.id, 'ai-copy', AI_RATE_LIMIT);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { productName, description, targetAudience, tone, variants } = parsed.data;

  // Check credits
  const hasCredits = await checkCredits(session.user.id, CREDIT_COSTS.COPY);
  if (!hasCredits) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });

  const systemPrompt = `You are an expert ad copywriter. Generate compelling ad copy for static image ads. Always return valid JSON.`;

  const userPrompt = `Generate ${variants} ad copy variants for:
Product/Brand: ${productName}
Description: ${description}
Target Audience: ${targetAudience || 'General'}
Tone: ${tone}

Return a JSON object with a "variants" array. Each variant should have: headline (max 60 chars), subheadline (max 90 chars), cta (max 25 chars), body (optional, max 150 chars).`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Deduct credits after successful generation
    await deductCredits(session.user.id, CREDIT_COSTS.COPY);

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }
    console.error('[AI Copy]', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

