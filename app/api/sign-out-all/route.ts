import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { sessionVersion: { increment: 1 } },
    })
    await logAudit({ userId: user.id, action: 'SIGN_OUT_ALL_DEVICES', ipAddress: getIp(req) })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('sign-out-all error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
