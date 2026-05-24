import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  width: z.number().int().min(100).max(4000).default(1200),
  height: z.number().int().min(100).max(4000).default(628),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, thumbnailUrl: true, width: true, height: true, status: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      width: parsed.data.width,
      height: parsed.data.height,
      description: parsed.data.description,
      canvasState: {},
    },
  });

  return NextResponse.json(project, { status: 201 });
}

