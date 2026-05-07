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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const targetId = Number(id)
  if (targetId === admin.id) return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  try {
    await prisma.user.update({ where: { id: targetId }, data: { isAdmin: false } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
