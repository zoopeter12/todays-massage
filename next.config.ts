import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Reverted: Remove static export, use standard Next.js build
  // output: 'export', 
  images: {
    // unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
