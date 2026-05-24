/**
 * Next.js instrumentation hook — runs once when the server starts.
 * We use it to patch globals that headless/sandbox environments may inject
 * with broken implementations (e.g. a `window.localStorage` whose `.getItem`
 * is not a function because `--localstorage-file` has an invalid path).
 */
export async function register() {
  // Patch localStorage / sessionStorage if they exist but are non-functional
  const noop = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };

  for (const key of ["localStorage", "sessionStorage"] as const) {
    try {
      const store = (globalThis as Record<string, unknown>)[key] as Storage | undefined;
      if (store !== undefined && typeof store?.getItem !== "function") {
        Object.defineProperty(globalThis, key, {
          value: noop,
          writable: true,
          configurable: true,
        });
      }
    } catch {
      // ignore — some envs disallow property redefinition
    }
  }
}
