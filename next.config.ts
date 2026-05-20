import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs'

const APP_URL = process.env.NEXTAUTH_URL || 'https://feetracker.co.ke'
const VERCEL_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://feetracker-seven.vercel.app'
const CUSTOM_DOMAIN = 'https://feetracker.co.ke'

const allowedOrigins = [...new Set([APP_URL, VERCEL_URL, CUSTOM_DOMAIN])].join(' ')

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://client.crisp.chat https://plausible.io",
  "style-src 'self' 'unsafe-inline' https://client.crisp.chat",
  "img-src 'self' data: blob: https://client.crisp.chat https://image.crisp.chat",
  `connect-src 'self' ${allowedOrigins} https://o*.ingest.sentry.io https://api.pwnedpasswords.com wss://client.crisp.chat https://api.crisp.chat https://plausible.io`,
  "font-src 'self' data: https://client.crisp.chat",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['recharts', 'xlsx', 'papaparse'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
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

export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  sourcemaps: {
    disable: true,
  },
})
