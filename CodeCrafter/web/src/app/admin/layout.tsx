"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard, Code2, Trophy, BookOpen,
  Calendar, Users, Shield, ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/admin",               label: "Dashboard",       icon: LayoutDashboard },
  { href: "/admin/problems",      label: "Problems",        icon: Code2 },
  { href: "/admin/contests",      label: "Contests",        icon: Trophy },
  { href: "/admin/study-plans",   label: "Study Plans",     icon: BookOpen },
  { href: "/admin/daily-challenge", label: "Daily Challenge", icon: Calendar },
  { href: "/admin/users",         label: "Users",           icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;
    const roles: string[] = session?.roles ?? [];
    if (!roles.includes("ROLE_ADMIN")) {
      router.replace("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-zinc-800 flex flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold">Admin Panel</span>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 px-2">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-emerald-950/60 text-emerald-400"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-zinc-800">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
