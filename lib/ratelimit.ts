// In-memory rate limiter: works within warm serverless instances.
// For multi-instance production use, replace with Upstash Redis.
const requests = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = requests.get(ip)

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= 100) return false

  entry.count++
  return true
}

export function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
}
