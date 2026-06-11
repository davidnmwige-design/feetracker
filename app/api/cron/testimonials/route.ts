import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { isAuthorizedCron } from '@/lib/cronAuth'
import crypto from 'crypto'

function makeToken(schoolId: number): string {
  return crypto.createHash('sha256').update(String(schoolId) + (process.env.NEXTAUTH_SECRET || '')).digest('hex').slice(0, 16)
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const schools = await prisma.school.findMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      testimonialRequestSent: false,
      students: { some: {} },
    },
    include: { user: { select: { name: true, email: true } } },
  })

  let sent = 0
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://feetracker-seven.vercel.app'

  for (const school of schools) {
    const token = makeToken(school.id)
    const submitUrl = `${appUrl}/testimonials/submit?school=${school.id}&token=${token}`

    try {
      await sendEmail({
        to: school.user.email,
        subject: `How is Elimu Pay working for ${school.name}?`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#0a1f4e;padding:20px 24px">
            <h1 style="margin:0;font-family:Georgia,serif;font-size:20px"><span style="color:#fff">Elimu</span><span style="color:#c8a84b"> Pay</span></h1>
          </div>
          <div style="padding:28px;background:#fff;border:1px solid #e2e8f0">
            <h2 style="color:#0f172a;font-size:17px;margin:0 0 12px">How are things going?</h2>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 16px">Hi ${school.user.name},</p>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 16px">You have been using Elimu Pay for over a month now. We would love to hear how it is going for <strong>${school.name}</strong>.</p>
            <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px">Would you share a quick testimonial? It takes 2 minutes and helps other schools discover Elimu Pay.</p>
            <a href="${submitUrl}" style="display:inline-block;background:#c8a84b;color:#0a1f4e;padding:12px 24px;border-radius:6px;font-weight:700;font-size:14px;text-decoration:none">Share your experience</a>
          </div>
          <div style="padding:12px;background:#f8f9fc;text-align:center">
            <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay &middot; support@elimupay.co.ke</p>
          </div>
        </div>`,
        fromName: 'Elimu Pay',
      })
      await prisma.school.update({ where: { id: school.id }, data: { testimonialRequestSent: true } })
      await prisma.testimonial.upsert({
        where: { schoolId: school.id },
        update: { requestSentAt: new Date() },
        create: { schoolId: school.id, schoolName: school.name, requestSentAt: new Date() },
      })
      sent++
    } catch (err) {
      console.error(`[cron/testimonials] Failed for school ${school.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, sent, total: schools.length })
}
