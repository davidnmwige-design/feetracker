import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { create2faCookieValue, COOKIE_NAME } from '@/lib/twofa'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await req.json()
  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 })
  }

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

  const cookieValue = await create2faCookieValue(user.id, process.env.NEXTAUTH_SECRET!)
  const response = NextResponse.json({ success: true })
  response.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60,
    path: '/',
  })
  return response
}
