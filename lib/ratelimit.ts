import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Upstash Redis client (created lazily on first use) ───────────────────────
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

// ─── Lazy limiter getters ─────────────────────────────────────────────────────
// Limiters are created on first call, NOT at module load time.
// This prevents Upstash from being instantiated during Next.js static analysis.

let _auth: Ratelimit | null | undefined
export function getAuthLimiter(): Ratelimit | null {
  if (_auth === undefined) _auth = createLimiter(5, '15 m')   // login / admin-setup
  return _auth
}

let _signup: Ratelimit | null | undefined
export function getSignupLimiter(): Ratelimit | null {
  if (_signup === undefined) _signup = createLimiter(3, '1 h')  // account creation
  return _signup
}

let _passwordReset: Ratelimit | null | undefined
export function getPasswordResetLimiter(): Ratelimit | null {
  if (_passwordReset === undefined) _passwordReset = createLimiter(3, '1 h')  // forgot / reset
  return _passwordReset
}

let _otp: Ratelimit | null | undefined
export function getOtpLimiter(): Ratelimit | null {
  if (_otp === undefined) _otp = createLimiter(5, '15 m')   // 2FA send + verify
  return _otp
}

let _upload: Ratelimit | null | undefined
export function getUploadLimiter(): Ratelimit | null {
  if (_upload === undefined) _upload = createLimiter(10, '1 h')  // file uploads
  return _upload
}

let _admin: Ratelimit | null | undefined
export function getAdminLimiter(): Ratelimit | null {
  if (_admin === undefined) _admin = createLimiter(30, '1 m')   // admin panel
  return _admin
}

let _api: Ratelimit | null | undefined
export function getApiLimiter(): Ratelimit | null {
  if (_api === undefined) _api = createLimiter(60, '1 m')    // general API
  return _api
}

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
// Pure in-memory sliding window — no external dependencies.
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
