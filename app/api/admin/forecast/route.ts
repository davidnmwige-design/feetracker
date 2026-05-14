import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const PLAN_MONTHLY: Record<string, number> = { Starter: 4500, Growth: 6500, Premium: 9000, Enterprise: 15000 }

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const nextQuarterEnd = new Date(now.getFullYear(), now.getMonth() + 3, 1)
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const schools = await prisma.school.findMany({
    include: { user: { select: { name: true, email: true } } },
  })

  // Active schools (not trial expired, or no trial)
  const activeSchools = schools.filter(s => !s.trialEndsAt || new Date(s.trialEndsAt) > now)
  const mrr = activeSchools.reduce((sum, s) => sum + (PLAN_MONTHLY[s.currentPlan || 'Starter'] || 4500), 0)

  // Schools whose trials expire this month (conversion opportunities)
  const trialsExpiringThisMonth = schools.filter(s => {
    if (!s.trialEndsAt) return false
    const exp = new Date(s.trialEndsAt)
    return exp >= now && exp <= thisMonthEnd
  })

  // 6-month MRR history from billing records
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const billingHistory = await prisma.billingRecord.findMany({
    where: { isPaid: true },
  })

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

  // Next month forecast: current active schools
  const nextMonthForecast = mrr
  // Next quarter: assume 5% growth per month
  const nextQuarterForecast = Math.round(mrr * 3 * 1.05)

  // Best/worst case
  const bestCase = Math.round(mrr + trialsExpiringThisMonth.length * 4500)
  const worstCase = Math.round(mrr * 0.9)

  // Schools renewing this month (joined in a previous year but same month)
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
    renewingThisMonth: renewingThisMonth.map(s => ({
      id: s.id, name: s.name,
      plan: s.currentPlan,
      monthlyFee: PLAN_MONTHLY[s.currentPlan || 'Starter'] || 4500,
    })),
    mrrHistory,
  })
}
