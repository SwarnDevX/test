'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../../lib/api.js';
import { Badge, Skeleton } from '@agentbay/ui';

export default function AdminUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.users(100),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-100">Users</h1>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900">
              <tr className="text-left text-zinc-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(data?.users ?? []).map((user) => (
                <tr key={user.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {user.id.slice(0, 10)}…
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                    {user.walletAddress.slice(0, 6)}…{user.walletAddress.slice(-4)}
                  </td>
                  <td className="px-4 py-3">
                    {user.isAdmin ? (
                      <Badge variant="destructive">admin</Badge>
                    ) : (
                      <Badge variant="secondary">user</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
