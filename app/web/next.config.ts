import type { NextConfig } from 'next';
import { URL } from 'url';

const cdnUrl = process.env.NEXT_PUBLIC_CDN_HOST || 'http://localhost:8080';
const url = new URL(cdnUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
        port: url.port || '',
        pathname: '/hls/**',
      },
    ],
  },
};

export default nextConfig;