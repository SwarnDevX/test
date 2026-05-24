import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

function parse(kit: { id: string; name: string; colors: string; fonts: string; logos: string; createdAt: Date; updatedAt: Date; userId: string }) {
  return { ...kit, colors: JSON.parse(kit.colors), fonts: JSON.parse(kit.fonts), logos: JSON.parse(kit.logos) };
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, colors, fonts, logos } = await request.json();
  const kit = await db.brandKit.updateMany({
    where: { id, userId: user.id },
    data: { name, colors: JSON.stringify(colors ?? []), fonts: JSON.stringify(fonts ?? []), logos: JSON.stringify(logos ?? []) },
  });
  if (kit.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await db.brandKit.findUnique({ where: { id } });
  return NextResponse.json(parse(updated!));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.brandKit.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
