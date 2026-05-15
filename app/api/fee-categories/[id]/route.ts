import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.role, 'fee-categories', 'DELETE')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const cat = await prisma.feeCategory.findFirst({ where: { id: Number(id), student: { schoolId: ctx.school.id } } })
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.feeCategory.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
