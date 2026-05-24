"use client";

import { SessionProvider } from "next-auth/react";

// Polyfill localStorage for environments where it exists but is broken
// (e.g. headless renderers that inject window but with a non-functional storage API)
if (typeof window !== "undefined") {
  try {
    window.localStorage.getItem("__test__");
  } catch {
    try {
      const noop = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      };
      Object.defineProperty(window, "localStorage", { value: noop, writable: true });
      Object.defineProperty(window, "sessionStorage", { value: noop, writable: true });
    } catch { /* ignore */ }
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
