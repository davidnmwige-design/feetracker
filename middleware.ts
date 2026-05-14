import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verify2faCookie, COOKIE_NAME } from '@/lib/twofa'

const PROTECTED_PREFIXES = ['/dashboard', '/students', '/upload', '/reminders', '/settings', '/reports', '/unmatched', '/invoices', '/setup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) return NextResponse.next()

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  console.log('[2FA Middleware] running on:', pathname)

  const secureCookie = process.env.NODE_ENV === 'production'
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie,
    cookieName: secureCookie ? '__Secure-authjs.session-token' : 'authjs.session-token',
    salt: secureCookie ? '__Secure-authjs.session-token' : 'authjs.session-token',
  })

  console.log('[2FA Middleware] token exists:', !!token)
  console.log('[2FA Middleware] twoFactorEnabled:', (token as any)?.twoFactorEnabled)
  console.log('[2FA Middleware] userId in token:', (token as any)?.userId)
  console.log('[2FA Middleware] ft_2fa cookie:', req.cookies.get(COOKIE_NAME)?.value ? 'present' : 'absent')

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const twoFactorEnabled = Boolean((token as any).twoFactorEnabled)
  if (twoFactorEnabled) {
    const userId = Number((token as any).userId)
    const cookie = req.cookies.get(COOKIE_NAME)?.value
    console.log('[2FA Middleware] checking 2FA cookie for userId:', userId)
    const verified = await verify2faCookie(cookie, userId, process.env.NEXTAUTH_SECRET!)
    console.log('[2FA Middleware] cookie verified:', verified)
    if (!verified) {
      const url = req.nextUrl.clone()
      url.pathname = '/verify-2fa'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
