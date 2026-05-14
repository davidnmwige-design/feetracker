import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [newSchools, paymentsToday, invoicesToday, uploadsToday, churnSchools, trialConverted, totalTrials] = await Promise.all([
    prisma.school.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.payment.count({ where: { paidAt: { gte: todayStart } } }),
    prisma.invoice.count({ where: { sentAt: { gte: todayStart } } }),
    prisma.auditLog.count({ where: { action: 'UPLOAD', createdAt: { gte: todayStart } } }),
    // Churn: schools with no audit activity in last 30 days
    prisma.$queryRaw<{ id: number }[]>`
      SELECT s.id FROM "School" s
      WHERE NOT EXISTS (
        SELECT 1 FROM "AuditLog" a
        WHERE a."schoolId" = s.id
        AND a."createdAt" > NOW() - INTERVAL '30 days'
      )
    `,
    // Trial conversions: had a trial that ended and are now on paid plan
    prisma.school.count({
      where: {
        trialEndsAt: { lt: new Date() },
        currentPlan: { not: 'Starter' }
      }
    }),
    prisma.school.count({ where: { trialEndsAt: { not: null } } }),
  ])

  const trialConversionRate = totalTrials > 0 ? Math.round((trialConverted / totalTrials) * 100) : 0

  return NextResponse.json({
    newSchools,
    paymentsToday,
    invoicesToday,
    uploadsToday,
    churnCount: churnSchools.length,
    trialConversionRate,
    trialConverted,
    totalTrials,
  })
}
