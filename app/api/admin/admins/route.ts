import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

async function requireAdmin(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  return user?.isAdmin ? user : null
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, name: true, email: true, createdAt: true }
    })
    return NextResponse.json(admins)
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
