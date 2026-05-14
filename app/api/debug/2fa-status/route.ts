import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ isLoggedIn: false })
  }
  return NextResponse.json({
    isLoggedIn: true,
    email: session.user.email,
    userId: session.user.id,
    twoFactorEnabled: (session.user as any).twoFactorEnabled ?? 'not in session',
  })
}
