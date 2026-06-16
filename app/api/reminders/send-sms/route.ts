import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { getEffectiveFee } from '@/lib/feeCalculations'
import { sendBulkSms, smsConfigured, reminderSmsText } from '@/lib/sms'
import { logAudit } from '@/lib/audit'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })
    if (!hasPermission(ctx.role, 'reminders/sms', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })
    if (!smsConfigured()) {
      return NextResponse.json({ error: 'SMS is not configured. Add the Celcom credentials in your environment settings.' }, { status: 400 })
    }

    const school = ctx.school
    const students = await prisma.student.findMany({
      where: { schoolId: school.id },
      include: { payments: true, bursary: true, studentDiscounts: { include: { discount: true } } },
    })

    const targets: { to: string; message: string }[] = []
    let noPhone = 0
    for (const s of students) {
      const paid = s.payments.reduce((sum, p) => sum + p.amount, 0)
      const balance = getEffectiveFee(s.feeRequired, s.bursary, s.studentDiscounts) - paid
      if (balance <= 0) continue
      if (!s.parentPhone) { noPhone++; continue }
      targets.push({ to: s.parentPhone, message: reminderSmsText(school, s, balance) })
    }

    if (targets.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, skipped: noPhone, message: 'No parents with a phone number and an outstanding balance.' })
    }

    const results = await sendBulkSms(targets)
    const sent = results.filter(r => r.ok).length
    const failed = results.length - sent

    logAudit({
      userId: ctx.userId, schoolId: school.id, action: 'SMS_REMINDERS_SENT',
      details: `${sent} sent, ${failed} failed, ${noPhone} without phone`, ipAddress: getIp(req),
    }).catch(() => {})

    return NextResponse.json({ sent, failed, skipped: noPhone })
  } catch (err) {
    console.error('send-sms error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
