import { redirect, notFound } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import EditorClient from '@/components/editor/EditorClient';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const project = await db.project.findUnique({
    where: { id, userId: user.id },
  });
  if (!project) notFound();

  const canvasState = (() => {
    try { return JSON.parse(project.canvasState); }
    catch { return { layers: [] }; }
  })();

  return (
    <EditorClient
      project={{ ...project, canvasState, createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString() }}
      user={{ id: user.id, email: user.email, name: user.name, credits: user.credits, subscription: user.subscription }}
    />
  );
}
