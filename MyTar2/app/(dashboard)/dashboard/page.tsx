import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardContent from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [projects, brandKitCount] = await Promise.all([
    db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      select: { id: true, name: true, formatName: true, thumbnail: true, updatedAt: true },
    }),
    db.brandKit.count({ where: { userId: user.id } }),
  ]);

  const serializedProjects = projects.map(p => ({
    ...p,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <DashboardContent
      user={{ name: user.name, email: user.email, credits: user.credits, subscription: user.subscription }}
      projects={serializedProjects}
      brandKitCount={brandKitCount}
    />
  );
}
