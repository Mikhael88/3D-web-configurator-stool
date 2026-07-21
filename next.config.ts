import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['*'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow this app to be embedded as an iframe from any origin
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
      {
        // Next's static file server has no built-in .usdz mime mapping and
        // falls back to application/octet-stream — Safari's AR Quick Look
        // requires this exact Content-Type or it just downloads the file
        // instead of launching AR.
        source: '/models/usdz/:path*.usdz',
        headers: [{ key: 'Content-Type', value: 'model/vnd.usdz+zip' }],
      },
    ]
  },
};

export default nextConfig;
