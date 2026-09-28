// next.config.ts
import type { NextConfig } from 'next';

/**
 * Next.js configuration.
 * Using the app router (app directory) and enabling strict mode.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [],
  },
  // Future: add any rewrites or redirects here.
};

export default nextConfig;
