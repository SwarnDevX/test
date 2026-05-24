import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { generateAdCopy } from '@/lib/ai';
import { checkAndDeductCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const credit = await checkAndDeductCredits(user.id, 'generate-copy');
  if (!credit.success) return NextResponse.json({ error: credit.error, remainingCredits: credit.remainingCredits }, { status: 402 });

  const body = await request.json();
  if (!body.productName?.trim()) return NextResponse.json({ error: 'Product name required' }, { status: 400 });

  try {
    const copy = await generateAdCopy(body);
    return NextResponse.json({ ...copy, remainingCredits: credit.remainingCredits });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Copy generation failed' }, { status: 500 });
  }
}
