"use client";

import { useQuery } from "@tanstack/react-query";
import { Code2, Users, Trophy, BookOpen, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface DashboardStats {
  totalProblems: number;
  activeProblems: number;
  totalUsers: number;
  activeContests: number;
  totalSubmissions: number;
  todayChallengeSet: boolean;
}

function StatCard({
  icon: Icon, label, value, href, color,
}: {
  icon: React.ElementType; label: string; value: number | string; href: string; color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-emerald-500/30 hover:bg-zinc-900 transition-all"
    >
      <div className={`p-3 rounded-lg bg-zinc-800 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-zinc-100">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/admin/stats").then(r => r.data).catch(() => null),
    staleTime: 60_000,
  });

  const cards = [
    { icon: Code2,    label: "Total Problems",    value: stats?.totalProblems ?? "—",   href: "/admin/problems",       color: "text-emerald-400" },
    { icon: Users,    label: "Registered Users",  value: stats?.totalUsers ?? "—",      href: "/admin/users",          color: "text-blue-400"    },
    { icon: Trophy,   label: "Active Contests",   value: stats?.activeContests ?? "—",  href: "/admin/contests",       color: "text-amber-400"   },
    { icon: BookOpen, label: "Active Problems",   value: stats?.activeProblems ?? "—",  href: "/admin/problems",       color: "text-purple-400"  },
    { icon: Calendar, label: "Today's Challenge", value: stats?.todayChallengeSet ? "Set" : "Not set", href: "/admin/daily-challenge", color: "text-rose-400" },
    { icon: TrendingUp,label: "Total Submissions",value: stats?.totalSubmissions ?? "—",href: "/admin/problems",       color: "text-cyan-400"    },
  ];

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-zinc-500">Overview of the platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickActions />
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "Create problem",          href: "/admin/problems/new",  desc: "Add a new problem with test cases" },
    { label: "Schedule daily challenge", href: "/admin/daily-challenge", desc: "Set tomorrow's featured problem" },
    { label: "Create contest",          href: "/admin/contests",      desc: "Set up a new rated contest" },
    { label: "Manage users",            href: "/admin/users",         desc: "Ban, unban, or promote users" },
  ];
  return (
    <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h2 className="text-sm font-semibold mb-4 text-zinc-300">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(a => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col gap-1 p-3 rounded-lg border border-zinc-800 hover:border-emerald-500/30 hover:bg-zinc-800/60 transition-all"
          >
            <span className="text-sm font-medium text-zinc-100">{a.label}</span>
            <span className="text-xs text-zinc-500">{a.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
