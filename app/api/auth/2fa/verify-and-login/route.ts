import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { checkRateLimitAsync, authLimiter, getIdentifier, rateLimitResponse } from '@/lib/ratelimit'

export async function POST(req: Request) {
  const rl = await checkRateLimitAsync(authLimiter, getIdentifier(req) + ':verify-login')
  if (!rl.success) return rateLimitResponse(rl.reset)

  const { email, password, code } = await req.json()

  if (!email || !password || !code) {
    return NextResponse.json({ error: 'Email, password, and code are required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, twoFactorEnabled: true },
  })

  // Validate credentials
  if (!user || !(await bcrypt.compare(String(password), user.password))) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA is not enabled for this account' }, { status: 400 })
  }

  // Validate OTP
  const otpRecord = await prisma.oTPCode.findFirst({
    where: { userId: user.id, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  if (!otpRecord) {
    return NextResponse.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 400 })
  }

  if (otpRecord.code !== String(code)) {
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
  }

  await prisma.oTPCode.update({ where: { id: otpRecord.id }, data: { used: true } })

  // Set the ft_2fa cookie so require2FA() passes after login completes
  const expiry = Date.now() + 24 * 60 * 60 * 1000
  const cookieValue = `${user.id}:${expiry}:valid`

  const response = NextResponse.json({ success: true })
  response.cookies.set('ft_2fa', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
  })
  return response
}
