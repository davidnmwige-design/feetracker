import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verify2faCookieValue } from '@/lib/check2fa'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ verified: false, reason: 'not_logged_in' })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, twoFactorEnabled: true },
  })

  if (!user) return NextResponse.json({ verified: false, reason: 'user_not_found' })

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ verified: true })
  }

  const ft2fa = req.cookies.get('ft_2fa')?.value
  const valid = verify2faCookieValue(ft2fa, user.id)
  return NextResponse.json({ verified: valid })
}
