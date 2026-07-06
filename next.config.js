const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\/api\/v1\/dashboard/,
      handler: 'NetworkFirst',
      options: { cacheName: 'dashboard-cache', expiration: { maxAgeSeconds: 300 } },
    },
    {
      urlPattern: /^https:\/\/.*\/api\/v1\/qc/,
      handler: 'NetworkFirst',
      options: { cacheName: 'qc-cache', expiration: { maxAgeSeconds: 60 } },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://qc-backend.fly.dev/api/v1/:path*',
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
