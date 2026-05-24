import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exportQueue } from '@/queues';
import { checkCredits, deductCredits } from '@/lib/credits';
import { CREDIT_COSTS } from '@/lib/stripe';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const format = body.format ?? 'png';

  // Check credits
  const hasCredits = await checkCredits(session.user.id, CREDIT_COSTS.EXPORT);
  if (!hasCredits) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });

  // Create asset record
  const asset = await prisma.generatedAsset.create({
    data: {
      userId: session.user.id,
      projectId: params.id,
      type: 'EXPORT',
      creditCost: CREDIT_COSTS.EXPORT,
      status: 'PENDING',
    },
  });

  // Enqueue export job
  const job = await exportQueue.add('export', {
    userId: session.user.id,
    projectId: params.id,
    assetId: asset.id,
    canvasState: project.canvasState,
    width: project.width,
    height: project.height,
    format,
  });

  // Deduct credits
  await deductCredits(session.user.id, CREDIT_COSTS.EXPORT);

  return NextResponse.json({ assetId: asset.id, jobId: job.id });
}

