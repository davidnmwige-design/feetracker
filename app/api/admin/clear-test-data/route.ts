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

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const testSchools = await prisma.school.findMany({
      where: { name: { contains: 'test', mode: 'insensitive' } },
      select: { id: true, userId: true }
    })
    let deleted = 0
    for (const school of testSchools) {
      await prisma.invoice.deleteMany({ where: { schoolId: school.id } })
      await prisma.payment.deleteMany({ where: { schoolId: school.id } })
      await prisma.student.deleteMany({ where: { schoolId: school.id } })
      await prisma.term.deleteMany({ where: { schoolId: school.id } })
      await prisma.planUpgradeRequest.deleteMany({ where: { schoolId: school.id } })
      await prisma.schoolNote.deleteMany({ where: { schoolId: school.id } })
      await prisma.billingRecord.deleteMany({ where: { schoolId: school.id } })
      await prisma.contract.deleteMany({ where: { schoolId: school.id } })
      await prisma.school.delete({ where: { id: school.id } })
      await prisma.user.delete({ where: { id: school.userId } })
      deleted++
    }
    return NextResponse.json({ deleted })
  } catch (err) {
    console.error('clear-test-data error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
