import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

function parse(kit: { id: string; name: string; colors: string; fonts: string; logos: string; createdAt: Date; updatedAt: Date; userId: string }) {
  return { ...kit, colors: JSON.parse(kit.colors), fonts: JSON.parse(kit.fonts), logos: JSON.parse(kit.logos) };
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const kits = await db.brandKit.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(kits.map(parse));
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, colors = [], fonts = [], logos = [] } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const kit = await db.brandKit.create({
    data: { name, userId: user.id, colors: JSON.stringify(colors), fonts: JSON.stringify(fonts), logos: JSON.stringify(logos) },
  });
  return NextResponse.json(parse(kit), { status: 201 });
}
