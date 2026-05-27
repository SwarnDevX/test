// Next.js instrumentation hook — runs once at server startup.
// Initializes Sentry for server-side error tracking and OTEL tracing.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    const { init } = await import('@sentry/nextjs');

    init({
      dsn: process.env['SENTRY_DSN'],
      environment: process.env['NODE_ENV'],
      release:
        process.env['RAILWAY_GIT_COMMIT_SHA'] ??
        process.env['VERCEL_GIT_COMMIT_SHA'] ??
        'unknown',
      tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.05 : 1.0,
      // Ignore known non-actionable errors
      ignoreErrors: [
        'NEXT_NOT_FOUND',
        'NEXT_REDIRECT',
        'ResizeObserver loop limit exceeded',
      ],
    });
  }

  if (process.env['NEXT_RUNTIME'] === 'edge') {
    const { init } = await import('@sentry/nextjs');

    init({
      dsn: process.env['SENTRY_DSN'],
      environment: process.env['NODE_ENV'],
      tracesSampleRate: 0.01,
    });
  }
}

export const onRequestError = async (
  error: unknown,
  request: { path: string; method: string },
) => {
  const { captureRequestError } = await import('@sentry/nextjs');
  captureRequestError(error, request);
};
