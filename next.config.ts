import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove static export - Electron needs the Next.js server for Server Actions
  // output: 'export',
  // trailingSlash: true,
  // skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during builds for faster packaging
    ignoreBuildErrors: true,
  },
  experimental: {
    esmExternals: false,
  },
};

export default nextConfig;
