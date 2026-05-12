import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayDow = now.getDay()
  const todayDom = now.getDate()

  const schedules = await prisma.reminderSchedule.findMany({
    where: { enabled: true },
    include: {
      school: {
        include: {
          students: { include: { payments: true } },
          user: true,
        }
      }
    }
  })

  let sent = 0
  let skipped = 0

  for (const schedule of schedules) {
    const isDue = schedule.frequency === 'weekly'
      ? todayDow === schedule.dayOfWeek
      : todayDom === schedule.dayOfMonth

    if (!isDue) { skipped++; continue }

    const lastSent = schedule.lastSentAt
    if (lastSent) {
      const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 20) { skipped++; continue }
    }

    const school = schedule.school
    const studentsWithBalance = school.students.filter(s => {
      const paid = s.payments.reduce((sum, p) => sum + p.amount, 0)
      return s.feeRequired - paid > 0 && s.parentPhone
    })

    if (studentsWithBalance.length > 0) {
      await prisma.reminderSchedule.update({
        where: { id: schedule.id },
        data: { lastSentAt: now },
      })
      sent++
      console.log(`[cron] School ${school.id} (${school.name}): ${studentsWithBalance.length} reminders due`)
    } else {
      skipped++
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, timestamp: now.toISOString() })
}
