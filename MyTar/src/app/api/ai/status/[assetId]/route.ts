import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { assetId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const asset = await prisma.generatedAsset.findFirst({
    where: { id: params.assetId, userId: session.user.id },
    select: { id: true, status: true, resultUrl: true, type: true, createdAt: true },
  });

  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(asset);
}

