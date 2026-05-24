import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getCreditBalance } from '@/lib/credits';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const credits = await getCreditBalance(user.id);
  const transactions = await db.creditTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({ credits, transactions });
}
