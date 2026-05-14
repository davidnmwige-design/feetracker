import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verify2faCookie, COOKIE_NAME } from '@/lib/twofa'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/verify-2fa', '/forgot-password', '/reset-password', '/demo', '/privacy', '/trial-expired', '/sitemap.xml']
const PROTECTED_PREFIXES = ['/dashboard', '/students', '/upload', '/reminders', '/settings', '/reports', '/unmatched', '/invoices', '/setup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip API routes and Next.js internals
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Skip admin routes (handled by admin layout)
  if (pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.includes(pathname)
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2FA check
  const twoFactorEnabled = Boolean((token as any).twoFactorEnabled)
  if (twoFactorEnabled) {
    const userId = Number((token as any).userId)
    const cookie = req.cookies.get(COOKIE_NAME)?.value
    const verified = verify2faCookie(cookie, userId, process.env.NEXTAUTH_SECRET!)
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
