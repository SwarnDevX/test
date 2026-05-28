"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Ban, CheckCircle, Shield, ShieldOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

interface AdminUser {
  id: number;
  email: string;
  username: string | null;
  emailVerified: boolean;
  active: boolean;
  roles: string[];
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useQuery<PageResponse<AdminUser>>({
    queryKey: ["admin-users", debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({ size: "100" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      return api.get(`/admin/users?${params}`).then(r => r.data);
    },
    staleTime: 30_000,
  });

  const banMutation = useMutation({
    mutationFn: ({ id, ban }: { id: number; ban: boolean }) =>
      api.patch(`/admin/users/${id}/${ban ? "ban" : "unban"}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(vars.ban ? "User banned" : "User unbanned");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role, add }: { id: number; role: string; add: boolean }) =>
      add
        ? api.post(`/admin/users/${id}/roles`, { role })
        : api.delete(`/admin/users/${id}/roles/${role}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const users = data?.content ?? [];

  return (
    <div className="p-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{data?.totalElements ?? 0} total</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            className="bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 w-64"
            placeholder="Search by email or username…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/80">
            <tr>
              <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium">User</th>
              <th className="text-left px-4 py-3 text-xs text-zinc-400 font-medium w-40">Email</th>
              <th className="text-center px-4 py-3 text-xs text-zinc-400 font-medium w-28">Roles</th>
              <th className="text-right px-4 py-3 text-xs text-zinc-400 font-medium w-24">Joined</th>
              <th className="text-center px-4 py-3 text-xs text-zinc-400 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {isLoading
              ? [...Array(8)].map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td></tr>
                ))
              : users.map(u => {
                  const isAdmin = u.roles.includes("ROLE_ADMIN");
                  return (
                    <tr key={u.id} className={`bg-zinc-900/40 hover:bg-zinc-900 transition-colors ${!u.active ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="text-zinc-100 font-medium">{u.username ?? <span className="text-zinc-500 italic">no username</span>}</p>
                        <p className="text-xs text-zinc-500">ID #{u.id}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs truncate max-w-[160px]">
                        <span title={u.email}>{u.email}</span>
                        {!u.emailVerified && <span className="ml-1.5 text-amber-500">unverified</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {u.roles.map(r => (
                            <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              {r.replace("ROLE_", "")}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => banMutation.mutate({ id: u.id, ban: u.active })}
                            disabled={banMutation.isPending}
                            className={`transition-colors disabled:opacity-50 ${u.active ? "text-zinc-500 hover:text-red-400" : "text-zinc-500 hover:text-emerald-400"}`}
                            title={u.active ? "Ban user" : "Unban user"}
                          >
                            {u.active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => roleMutation.mutate({ id: u.id, role: "ADMIN", add: !isAdmin })}
                            disabled={roleMutation.isPending}
                            className={`transition-colors disabled:opacity-50 ${isAdmin ? "text-emerald-400 hover:text-red-400" : "text-zinc-500 hover:text-emerald-400"}`}
                            title={isAdmin ? "Remove admin" : "Make admin"}
                          >
                            {isAdmin ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {!isLoading && users.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">
            {debouncedSearch ? `No users matching "${debouncedSearch}"` : "No users found."}
          </div>
        )}
      </div>
    </div>
  );
}
