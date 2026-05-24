import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await db.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, format: true, formatName: true, thumbnail: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, format, formatName } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Project name required' }, { status: 400 });

  const project = await db.project.create({
    data: { name: name.trim(), userId: user.id, format: format || '1080x1080', formatName: formatName || 'Square', canvasState: JSON.stringify({ layers: [] }) },
  });

  return NextResponse.json(project, { status: 201 });
}
