"use client";

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "@flowforge/api";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function makeTRPCClient() {
  return trpc.createClient({
    links: [
      loggerLink({
        enabled: (op) =>
          process.env.NODE_ENV === "development" ||
          (op.direction === "down" && op.result instanceof Error),
      }),
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/trpc`,
        transformer: superjson,
        headers() {
          const workspaceId = typeof localStorage !== "undefined"
            ? (localStorage.getItem("ff-workspace-id") ?? "")
            : "";
          return {
            "x-workspace-id": workspaceId,
          };
        },
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        },
      }),
    ],
  });
}
