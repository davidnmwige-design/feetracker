import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ isLoggedIn: false })
  }
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, twoFactorEnabled: true, sessionVersion: true },
  })
  return NextResponse.json({
    isLoggedIn: true,
    sessionEmail: session.user.email,
    sessionTwoFactorEnabled: (session.user as any).twoFactorEnabled,
    db: dbUser,
  })
}
