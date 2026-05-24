import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const brandKit = await prisma.brandKit.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!brandKit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ brandKit });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const kit = await prisma.brandKit.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!kit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { name, colors, fonts, logoUrl } = await req.json();

  const updated = await prisma.brandKit.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(colors && { colors }),
      ...(fonts && { fonts }),
      ...(logoUrl !== undefined && { logoUrl }),
    },
  });

  return NextResponse.json({ brandKit: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const kit = await prisma.brandKit.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!kit) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.brandKit.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

