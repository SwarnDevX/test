import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { aiQueue } from '@/queues';
import { checkCredits } from '@/lib/credits';
import { CREDIT_COSTS } from '@/lib/stripe';
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit';
import { z } from 'zod';

const schema = z.object({
  prompt: z.string().min(3).max(1000),
  projectId: z.string(),
  width: z.number().int().min(100).max(4000).optional(),
  height: z.number().int().min(100).max(4000).optional(),
  style: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limiting
  const rl = await rateLimit(session.user.id, 'ai-background', AI_RATE_LIMIT);
  if (!rl.success) return rateLimitResponse(rl.resetAt);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { prompt, projectId, width = 1200, height = 628, style } = parsed.data;

  // Verify project ownership
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  // Check credits
  const hasCredits = await checkCredits(session.user.id, CREDIT_COSTS.BACKGROUND);
  if (!hasCredits) return NextResponse.json({ error: 'Insufficient credits. You need 3 credits.' }, { status: 402 });

  // Create asset record
  const asset = await prisma.generatedAsset.create({
    data: {
      userId: session.user.id,
      projectId,
      type: 'BACKGROUND',
      prompt,
      creditCost: CREDIT_COSTS.BACKGROUND,
      status: 'PENDING',
    },
  });

  // Enqueue job (credits deducted after successful generation in worker)
  const job = await aiQueue.add('generate-background', {
    userId: session.user.id,
    projectId,
    assetId: asset.id,
    prompt,
    width,
    height,
    style,
  });

  return NextResponse.json({ assetId: asset.id, jobId: job.id });
}

