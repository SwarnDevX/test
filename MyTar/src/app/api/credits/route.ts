import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBalance } from '@/lib/credits';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const balance = await getBalance(session.user.id);
  return NextResponse.json({ balance });
}

