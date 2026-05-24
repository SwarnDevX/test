import type { NextConfig } from "next";
import path from "path";
import os from "os";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    clientInstrumentationHook: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Use temp dir for webpack cache to avoid issues with spaces in path
      config.cache = {
        type: "filesystem",
        cacheDirectory: path.join(os.tmpdir(), "resumex-webpack-cache"),
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
};

export default nextConfig;
