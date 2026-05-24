import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generateBackgroundImage } from '@/lib/ai';
import { checkAndDeductCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const credit = await checkAndDeductCredits(user.id, 'generate-background');
  if (!credit.success) return NextResponse.json({ error: credit.error, remainingCredits: credit.remainingCredits }, { status: 402 });

  const { prompt, style = 'photorealistic', width = 1080, height = 1080 } = await request.json();
  if (!prompt?.trim()) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

  try {
    const result = await generateBackgroundImage(prompt, style, width, height);
    return NextResponse.json({ ...result, remainingCredits: credit.remainingCredits });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
