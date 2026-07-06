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
    {
      // Fitur EPG (Mirada) — backend terpisah
      urlPattern: /^https:\/\/.*\/api\/epg\//,
      handler: 'NetworkFirst',
      options: { cacheName: 'epg-cache', expiration: { maxAgeSeconds: 60 } },
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
        destination: 'https://rifqki-content-ops.hf.space/api/v1/:path*',
      },
      {
        // Backend EPG Metadata Tool (Mirada) — Space Hugging Face TERPISAH
        // dari Content-Ops. GANTI URL ini setelah Space `epgcontent-backend`
        // benar-benar di-deploy (lihat DEPLOYMENT_CHECKLIST_HF.md di repo
        // Mirada untuk cara deploy-nya). Rute Mirada TIDAK pakai prefix
        // /api/v1, jadi :path* diteruskan apa adanya (bukan digabung lagi).
        source: '/api/epg/:path*',
        destination: 'https://REPLACE-WITH-epgcontent-backend.hf.space/:path*',
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
