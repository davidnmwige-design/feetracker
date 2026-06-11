import { z } from 'zod'

// Server-side environment validation. Called once at startup (see instrumentation.ts) so the
// app fails fast with a clear message instead of breaking mid-request on a missing/invalid var.

const isProd = process.env.NODE_ENV === 'production'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL').optional(),
})

export function assertServerEnv(): void {
  const errors: string[] = []

  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors.push(`${issue.path.join('.')}: ${issue.message}`)
  }

  // NextAuth signing secret — required everywhere, must be long enough to be safe.
  const authSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || ''
  if (authSecret.length < 32) {
    errors.push('NEXTAUTH_SECRET (or AUTH_SECRET) must be set and at least 32 characters')
  }

  // Field-level encryption key — mandatory in production (see lib/encrypt.ts).
  if (isProd && (process.env.DATA_ENCRYPTION_KEY || '').length < 32) {
    errors.push('DATA_ENCRYPTION_KEY must be set to at least 32 characters in production')
  }

  if (errors.length > 0) {
    throw new Error(
      'Invalid environment configuration:\n' + errors.map(e => '  - ' + e).join('\n')
    )
  }

  // Non-fatal warnings for optional-but-recommended production settings.
  const warn = (m: string) => console.warn('[env] WARNING: ' + m)
  if (isProd && !process.env.CRON_SECRET) {
    warn('CRON_SECRET is not set — all /api/cron/* routes will reject requests (fail closed).')
  }
  if (isProd && (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)) {
    warn('Upstash is not configured — rate limiting is disabled (fails open).')
  }
}
