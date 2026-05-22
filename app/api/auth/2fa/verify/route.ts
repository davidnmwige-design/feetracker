import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimitAsync, getOtpLimiter, getIdentifier, rateLimitResponse } from '@/lib/ratelimit'
import { parseBody, verify2FASchema } from '@/lib/schemas'

export async function POST(req: Request) {
  const rl = await checkRateLimitAsync(getOtpLimiter(), getIdentifier(req) + ':verify-otp')
  if (!rl.success) return rateLimitResponse(rl.reset)

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
  const parsed = parseBody(verify2FASchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { code } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, twoFactorEnabled: true },
  })

  if (!user?.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 })
  }

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
