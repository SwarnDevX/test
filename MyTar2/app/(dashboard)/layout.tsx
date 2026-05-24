import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import DashboardSidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/Header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  // Serialize only the plain fields needed by client components (no Date objects)
  const serializedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    credits: user.credits,
    subscription: user.subscription,
    avatar: user.avatar,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07071a' }}>
      <DashboardSidebar user={serializedUser} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DashboardHeader user={serializedUser} />
        <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
