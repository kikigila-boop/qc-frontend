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
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
