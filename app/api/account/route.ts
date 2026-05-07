import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'

export async function DELETE(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Log before deletion so we have a record
    await logAudit({
      userId: user.id,
      schoolId: user.school?.id,
      action: 'ACCOUNT_DELETED',
      details: `School: ${user.school?.name ?? 'none'}`,
      ipAddress: getIp(req),
    })

    if (user.school) {
      const schoolId = user.school.id
      await prisma.invoice.deleteMany({ where: { schoolId } })
      await prisma.payment.deleteMany({ where: { schoolId } })
      await prisma.student.deleteMany({ where: { schoolId } })
      await prisma.term.deleteMany({ where: { schoolId } })
      await prisma.planUpgradeRequest.deleteMany({ where: { schoolId } })
      await prisma.schoolNote.deleteMany({ where: { schoolId } })
      await prisma.billingRecord.deleteMany({ where: { schoolId } })
      await prisma.school.delete({ where: { id: schoolId } })
    }
    await prisma.passwordReset.deleteMany({ where: { email: user.email } })
    await prisma.user.delete({ where: { id: user.id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('account DELETE error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
