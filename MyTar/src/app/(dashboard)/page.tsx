import { redirect } from 'next/navigation';

// Redirect /dashboard root if someone hits it directly
// The (dashboard) group handles all dashboard routes
export default function DashboardRootRedirect() {
  redirect('/dashboard');
}

