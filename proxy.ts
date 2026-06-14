import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isAdminIpAllowed } from '@/lib/ipAllowlist'

const PROTECTED_PREFIXES = ['/dashboard', '/students', '/upload', '/reminders', '/settings', '/reports', '/unmatched', '/invoices', '/setup']

async function upstashRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return true
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['INCR', key], ['PEXPIRE', key, windowMs]]),
    })
    if (!res.ok) return true
    const data = await res.json()
    const attempts = (data[0]?.result as number) ?? 0
    return attempts <= max
  } catch {
    return true
  }
}

function tooManyResponse(retryAfterSec: number): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSec) } }
  )
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rate limit sensitive endpoints before any handler processes them
  if (req.method === 'POST') {
    const ip =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown'

    if (pathname === '/api/auth/callback/credentials') {
      if (!(await upstashRateLimit(`rl:login:${ip}`, 5, 15 * 60 * 1000))) return tooManyResponse(900)
    } else if (pathname === '/api/signup') {
      if (!(await upstashRateLimit(`rl:signup:${ip}`, 3, 60 * 60 * 1000))) return tooManyResponse(3600)
    } else if (pathname === '/api/forgot-password') {
      if (!(await upstashRateLimit(`rl:forgot:${ip}`, 3, 60 * 60 * 1000))) return tooManyResponse(3600)
    } else if (pathname === '/api/admin/setup') {
      if (!(await upstashRateLimit(`rl:adminsetup:${ip}`, 5, 15 * 60 * 1000))) return tooManyResponse(900)
    }
  }

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    const ip =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      'unknown'
    if (!isAdminIpAllowed(ip)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
    return NextResponse.next()
  }

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const secureCookie = process.env.NODE_ENV === 'production'
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
    cookieName: secureCookie ? '__Secure-authjs.session-token' : 'authjs.session-token',
    salt: secureCookie ? '__Secure-authjs.session-token' : 'authjs.session-token',
  })

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/auth/callback/credentials',
    '/api/signup',
    '/api/forgot-password',
    '/api/admin/setup',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
