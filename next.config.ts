import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'omnixlab-production.up.railway.app',
          },
        ],
        destination: 'https://omnixlabsupport.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;