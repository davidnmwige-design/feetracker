import type { NextConfig } from "next";

const APP_URL = process.env.NEXTAUTH_URL || 'https://feetracker.co.ke'
const VERCEL_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://feetracker-seven.vercel.app'
const CUSTOM_DOMAIN = 'https://feetracker.co.ke'

const allowedOrigins = [...new Set([APP_URL, VERCEL_URL, CUSTOM_DOMAIN])].join(' ')

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${allowedOrigins}`,
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake unused exports from these packages to reduce bundle size
    optimizePackageImports: ['recharts', 'xlsx', 'papaparse'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // 0 is correct for modern browsers — the old '1; mode=block' value can cause issues
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // preload added — submit to https://hstspreload.org after domain is live
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: APP_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

export default nextConfig
