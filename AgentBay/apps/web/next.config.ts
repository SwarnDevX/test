import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
    instrumentationHook: true,
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organisation + project — read from SENTRY_ORG / SENTRY_PROJECT env vars at build time
  silent: true,
  // Upload source maps to Sentry for readable stack traces (requires SENTRY_AUTH_TOKEN)
  hideSourceMaps: true,
  disableLogger: true,
  // Automatically tree-shake Sentry server-side SDK from client bundle
  transpileClientSDK: true,
  // Tunnel Sentry requests through /monitoring to bypass ad-blockers
  tunnelRoute: '/monitoring',
  // Only upload source maps in CI/production builds
  uploadLargeFiles: false,
});
