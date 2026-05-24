import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppSidebar } from "@/components/dashboard/AppSidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <AppSidebar user={session.user} />
      <main className="flex-1 min-w-0 ml-[220px]">{children}</main>
    </div>
  );
}
