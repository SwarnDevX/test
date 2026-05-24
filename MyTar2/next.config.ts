import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  serverExternalPackages: ['sharp'],
  webpack(config) {
    // konva's `main` points to index-node.js which requires the 'canvas' npm package.
    // Redirect to the browser entry so the server bundle never pulls in canvas.
    config.resolve.alias['konva$'] = require.resolve('konva/lib/index');
    return config;
  },
};

export default nextConfig;
