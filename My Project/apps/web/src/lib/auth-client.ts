"use client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  workspaces: Array<{ id: string; name: string; slug: string; plan: string }>;
}

export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API}/trpc/auth.me`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json() as { result?: { data?: AuthUser } };
    return json.result?.data ?? null;
  } catch {
    return null;
  }
}

export async function logout() {
  await fetch(`${API}/trpc/auth.logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  window.location.href = "/login";
}
