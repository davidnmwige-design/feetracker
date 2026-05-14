import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getBillingAmount, getAnnualTotal } from '@/lib/pricing'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const schools = await prisma.school.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { students: true } },
    },
  })

  function schoolMRR(s: (typeof schools)[number]): number {
    const count = s._count?.students || 0
    const cycle = (s.billingCycle as 'monthly' | 'term' | 'annual') || 'monthly'
    // Monthly equivalent regardless of billing cycle
    return Math.round(getAnnualTotal(count) / 12)
  }

  // Active schools (not trial expired, or no trial)
  const activeSchools = schools.filter(s => !s.trialEndsAt || new Date(s.trialEndsAt) > now)
  const mrr = activeSchools.reduce((sum, s) => sum + schoolMRR(s), 0)

  // Schools whose trials expire this month (conversion opportunities)
  const trialsExpiringThisMonth = schools.filter(s => {
    if (!s.trialEndsAt) return false
    const exp = new Date(s.trialEndsAt)
    return exp >= now && exp <= thisMonthEnd
  })

  // 6-month MRR history from billing records
  const billingHistory = await prisma.billingRecord.findMany({ where: { isPaid: true } })

  const monthlyRevenue: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    monthlyRevenue[key] = billingHistory
      .filter(r => r.year === d.getFullYear() && r.month === d.getMonth() + 1)
      .reduce((s, r) => s + r.amount, 0)
  }

  const mrrHistory = Object.entries(monthlyRevenue).map(([key, amount]) => {
    const [year, month] = key.split('-')
    const d = new Date(Number(year), Number(month) - 1, 1)
    return {
      month: d.toLocaleString('en-KE', { month: 'short' }) + ' ' + year,
      amount,
    }
  })

  const nextMonthForecast = mrr
  const nextQuarterForecast = Math.round(mrr * 3 * 1.05)
  // Avg new trial converts at minimum subscription (20,000/year = ~1,667/month)
  const avgTrialValue = Math.round(20000 / 12)
  const bestCase = Math.round(mrr + trialsExpiringThisMonth.length * avgTrialValue)
  const worstCase = Math.round(mrr * 0.9)

  const renewingThisMonth = schools.filter(s => {
    const joined = new Date(s.createdAt)
    return joined.getMonth() === now.getMonth() && joined.getFullYear() < now.getFullYear()
  })

  return NextResponse.json({
    mrr,
    nextMonthForecast,
    nextQuarterForecast,
    bestCase,
    worstCase,
    trialsExpiringThisMonth: trialsExpiringThisMonth.map(s => ({
      id: s.id, name: s.name,
      trialEndsAt: s.trialEndsAt,
      adminEmail: s.user?.email,
      adminName: s.user?.name,
    })),
    renewingThisMonth: renewingThisMonth.map(s => {
      const count = s._count?.students || 0
      const cycle = (s.billingCycle as 'monthly' | 'term' | 'annual') || 'monthly'
      return {
        id: s.id, name: s.name,
        plan: s.currentPlan,
        monthlyFee: Math.round(getAnnualTotal(count) / 12),
        billingCycle: cycle,
        billingAmount: getBillingAmount(count, cycle),
      }
    }),
    mrrHistory,
  })
}
