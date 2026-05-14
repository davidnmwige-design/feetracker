import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED_PREFIXES = ['/dashboard', '/students', '/upload', '/reminders', '/settings', '/reports', '/unmatched', '/invoices', '/setup']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) return NextResponse.next()

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
