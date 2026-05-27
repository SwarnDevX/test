"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Providers } from "@/app/providers";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { trpc } from "@/lib/trpc";

function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      router.replace("/login");
    }
  }, [user, isLoading, error, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar
        workspaceName={(user as any).workspaceMembers?.[0]?.workspace?.name ?? "My Workspace"}
        userEmail={user.email}
      />
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
