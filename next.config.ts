import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Electron packaging
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle Node.js modules in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        http2: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        events: false,
        child_process: false,
        worker_threads: false,
        perf_hooks: false,
        dns: false,
        async_hooks: false,
      };
    }
    return config;
  },
};

export default nextConfig;
