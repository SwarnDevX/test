import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const targetUrl = `${API_URL}${url.pathname.replace("/api/auth", "/auth")}${url.search}`;

  return fetch(new Request(targetUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    duplex: "half",
  } as RequestInit & { duplex: string }));
}

export { handler as GET, handler as POST };
