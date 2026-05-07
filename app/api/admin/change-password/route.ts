import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { current, next } = await req.json()
    if (!current || !next) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (next.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    const valid = await bcrypt.compare(current, user.password)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    const hashed = await bcrypt.hash(next, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, sessionVersion: { increment: 1 } }
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
