import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@neondatabase/serverless'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
}

export default nextConfig
