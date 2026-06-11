import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { checkRateLimitAsync, getAuthLimiter, getIdentifier, rateLimitResponse } from '@/lib/ratelimit'
import { parseBody, verifyAndLoginSchema } from '@/lib/schemas'
import { buildTwoFactorCookie } from '@/lib/check2fa'

export async function POST(req: Request) {
  const rl = await checkRateLimitAsync(getAuthLimiter(), getIdentifier(req) + ':verify-login')
  if (!rl.success) return rateLimitResponse(rl.reset)

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
  const parsed = parseBody(verifyAndLoginSchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { email, password, code } = parsed.data

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

  if (!(await bcrypt.compare(String(code), otpRecord.code))) {
    return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
  }

  await prisma.oTPCode.update({ where: { id: otpRecord.id }, data: { used: true } })

  // Set the signed ft_2fa cookie so require2FA() passes after login completes
  const expiry = Date.now() + 24 * 60 * 60 * 1000

  const response = NextResponse.json({ success: true })
  response.cookies.set('ft_2fa', buildTwoFactorCookie(user.id, expiry), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 86400,
    path: '/',
  })
  return response
}
