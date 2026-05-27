"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, LayoutDashboard, GitBranch, Play, Database,
  Key, Rocket, Layout, Settings, ChevronLeft, ChevronRight,
  Plus, LogOut, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { logout } from "@/lib/auth-client";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/workflows", icon: GitBranch, label: "Workflows" },
  { href: "/executions", icon: Play, label: "Executions" },
  { href: "/knowledge", icon: Database, label: "Knowledge" },
  { href: "/credentials", icon: Key, label: "Credentials" },
  { href: "/deployments", icon: Rocket, label: "Deployments" },
  { href: "/templates", icon: Layout, label: "Templates" },
] as const;

interface SidebarProps {
  workspaceName?: string;
  userEmail?: string;
}

export function Sidebar({ workspaceName = "My Workspace", userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 216 }}
      transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.2 }}
      className="relative flex flex-col h-full bg-bg-surface-1 border-r border-border/60 overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-3 border-b border-border/60 flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.15 }}
              className="ml-2 font-semibold text-sm whitespace-nowrap overflow-hidden"
            >
              FlowForge
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Workspace selector */}
      {!sidebarCollapsed && (
        <div className="px-3 py-2 border-b border-border/60">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-bg-surface-2 transition-colors text-left">
            <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-accent">{workspaceName[0]?.toUpperCase()}</span>
            </div>
            <span className="text-xs font-medium truncate">{workspaceName}</span>
          </button>
        </div>
      )}

      {/* New workflow button */}
      <div className="px-2 py-2 border-b border-border/60">
        <Link
          href="/workflows/new"
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent/10 hover:bg-accent/20 text-accent transition-colors text-sm font-medium",
            sidebarCollapsed && "justify-center",
          )}
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>New workflow</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                active
                  ? "bg-bg-surface-3 text-fg font-medium"
                  : "text-fg-muted hover:bg-bg-surface-2 hover:text-fg",
                sidebarCollapsed && "justify-center",
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-2 border-t border-border/60 space-y-0.5">
        <Link
          href="/settings/general"
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-fg-muted hover:bg-bg-surface-2 hover:text-fg transition-colors",
            sidebarCollapsed && "justify-center",
          )}
          title={sidebarCollapsed ? "Settings" : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Settings</span>}
        </Link>

        {!sidebarCollapsed && userEmail && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
            <div className="w-6 h-6 rounded-full bg-bg-surface-3 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-fg-muted" />
            </div>
            <span className="text-xs text-fg-muted truncate flex-1">{userEmail}</span>
            <button onClick={logout} title="Sign out" className="text-fg-muted hover:text-fg transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute top-[52px] -right-3 w-6 h-6 rounded-full border border-border/60 bg-bg-surface-2 hover:bg-bg-surface-3 flex items-center justify-center text-fg-muted hover:text-fg transition-all z-10"
      >
        {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
