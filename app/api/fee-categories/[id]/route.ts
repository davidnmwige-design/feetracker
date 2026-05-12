import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, include: { school: true } })
  if (!user?.school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id, user.school)
  if (!hasPermission(role, 'fee-categories', 'DELETE')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const cat = await prisma.feeCategory.findFirst({ where: { id: Number(id), student: { schoolId: user.school.id } } })
  if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.feeCategory.delete({ where: { id: Number(id) } })
  return NextResponse.json({ success: true })
}
