import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const trpcPath = url.pathname.replace("/api/trpc", "");
  const targetUrl = `${API_URL}/trpc${trpcPath}${url.search}`;

  const proxyReq = new Request(targetUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    duplex: "half",
  } as RequestInit & { duplex: string });

  return fetch(proxyReq);
}

export { handler as GET, handler as POST };
