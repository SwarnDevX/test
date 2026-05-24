"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { FileText, LayoutDashboard, LayoutTemplate, LogOut, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "My Resumes", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
];

interface Props {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export function AppSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[220px] flex flex-col py-5 px-3 z-40"
      style={{
        background: "rgba(7,7,26,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
          <FileText className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white">
          Resume<span className="gradient-text">X</span>
        </span>
      </Link>

      {/* New resume button */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white mb-4"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.3))", border: "1px solid rgba(99,102,241,0.3)" }}
        id="new-resume-btn"
      >
        <Plus className="w-4 h-4" />
        New Resume
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                active
                  ? "text-white font-medium"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
              style={active ? { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" } : {}}
            >
              <item.icon className={cn("w-4 h-4", active ? "text-indigo-400" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/[0.06] pt-4 mt-4">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
          >
            {(user.name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name ?? "User"}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
