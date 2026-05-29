import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAuthLimiter, checkRateLimitAsync, getIdentifier } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const ip = getIdentifier(req)
  const limiter = getAuthLimiter()
  const sdkResult = limiter ? await checkRateLimitAsync(limiter, `debug:${ip}`) : null

  // Test Upstash REST API directly (same path as middleware uses)
  let restResult: unknown = null
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([['INCR', `debug:rest:${ip}`], ['PEXPIRE', `debug:rest:${ip}`, 60000]]),
      })
      restResult = { ok: res.ok, status: res.status, data: await res.json() }
    } catch (err) {
      restResult = { error: String(err) }
    }
  }

  return NextResponse.json({
    ip,
    upstashConfigured: !!(url && token),
    sdkLimiterInitialized: !!limiter,
    sdkRateLimit: sdkResult,
    restApiTest: restResult,
  })
}
