import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Upstash Redis client ────────────────────────────────────────────────────
function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

function createLimiter(requests: number, window: Duration): Ratelimit | null {
  const redis = getRedis()
  if (!redis) return null
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window), analytics: false })
}

// ─── Named limiters ──────────────────────────────────────────────────────────
export const authLimiter          = createLimiter(5,  '15 m')   // login / admin-setup
export const signupLimiter        = createLimiter(3,  '1 h')    // account creation
export const passwordResetLimiter = createLimiter(3,  '1 h')    // forgot / reset password
export const otpLimiter           = createLimiter(5,  '15 m')   // 2FA send + verify
export const uploadLimiter        = createLimiter(10, '1 h')    // file uploads
export const adminLimiter         = createLimiter(30, '1 m')    // admin panel
export const apiLimiter           = createLimiter(60, '1 m')    // general API

// ─── Async rate limit check ───────────────────────────────────────────────────
export async function checkRateLimitAsync(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!limiter) return { success: true, limit: 999, remaining: 999, reset: 0 }
  try {
    return await limiter.limit(identifier)
  } catch {
    // Redis down → fail open (do not block legitimate users)
    return { success: true, limit: 999, remaining: 999, reset: 0 }
  }
}

// ─── Identifier helpers ───────────────────────────────────────────────────────
export function getIdentifier(request: Request): string {
  const cfIp      = request.headers.get('cf-connecting-ip')
  const realIp    = request.headers.get('x-real-ip')
  const forwarded = request.headers.get('x-forwarded-for')
  return cfIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : null) || 'unknown'
}

// ─── Standard 429 response ────────────────────────────────────────────────────
export function rateLimitResponse(reset: number): Response {
  const secondsUntilReset = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
  const minutesUntilReset = Math.ceil(secondsUntilReset / 60)
  return new Response(
    JSON.stringify({
      error: `Too many requests. Please try again in ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}.`,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(secondsUntilReset),
        'X-RateLimit-Reset': new Date(reset).toISOString(),
      },
    },
  )
}

// ─── Backward-compatible synchronous rate limiter ────────────────────────────
// Used by ~40 existing routes via checkRateLimit(getIp(req)).
// In-memory sliding window — still provides per-instance protection.
const _memRequests = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = _memRequests.get(ip)
  if (!entry || now > entry.resetAt) {
    _memRequests.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 100) return false
  entry.count++
  return true
}

export function getIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  )
}
