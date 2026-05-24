import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = await db.project.findUnique({ where: { id, userId: user.id } });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ...project, canvasState: JSON.parse(project.canvasState) });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if (body.name) updateData.name = body.name;
  if (body.canvasState) updateData.canvasState = JSON.stringify(body.canvasState);
  if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail;

  const project = await db.project.updateMany({ where: { id, userId: user.id }, data: updateData });
  if (project.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await db.project.findUnique({ where: { id } });
  return NextResponse.json({ ...updated, canvasState: JSON.parse(updated!.canvasState) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.project.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
