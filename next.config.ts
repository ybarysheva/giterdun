import type { NextConfig } from 'next';
import { execSync } from 'child_process';

let buildTimestamp = String(Date.now());
let buildInfo = 'local dev';
try {
  const ts = execSync('git log -1 --format=%ct', { encoding: 'utf-8' }).trim();
  buildTimestamp = String(parseInt(ts) * 1000);
  buildInfo = execSync('git log -1 --format=%s', { encoding: 'utf-8' }).trim();
} catch {
  // fallback to defaults
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIMESTAMP: buildTimestamp,
    NEXT_PUBLIC_BUILD_INFO: buildInfo,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
