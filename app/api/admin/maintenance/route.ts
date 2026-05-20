import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()

  const [expiredOtps, usedResets] = await Promise.all([
    prisma.oTPCode.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.passwordReset.deleteMany({ where: { OR: [{ used: true }, { expiresAt: { lt: now } }] } }),
  ])

  const [studentCount, paymentCount, auditCount] = await Promise.all([
    prisma.student.count(),
    prisma.payment.count(),
    prisma.auditLog.count(),
  ])

  return NextResponse.json({
    cleaned: {
      expiredOtpCodes: expiredOtps.count,
      expiredPasswordResets: usedResets.count,
    },
    tableSizes: {
      students: studentCount,
      payments: paymentCount,
      auditLogs: auditCount,
    },
    ranAt: now.toISOString(),
  })
}
