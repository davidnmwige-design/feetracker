import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { parseBody, announcementSchema } from '@/lib/schemas'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const announcements = await prisma.adminAnnouncement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(announcements)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
  const parsed = parseBody(announcementSchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { subject, message, recipientType } = parsed.data

  // Determine recipient schools
  const now = new Date()
  let schoolFilter: any = {}
  if (recipientType === 'trial') schoolFilter = { trialEndsAt: { gt: now } }
  else if (recipientType === 'active') schoolFilter = { OR: [{ trialEndsAt: null }, { trialEndsAt: { lte: now } }] }
  else if (recipientType && recipientType.startsWith('plan:')) {
    schoolFilter = { currentPlan: recipientType.replace('plan:', '') }
  }

  const schools = await prisma.school.findMany({
    where: schoolFilter,
    include: { user: { select: { name: true, email: true } } },
  })

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
      <div style="background:#0a1f4e;padding:20px 24px">
        <h1 style="color:#c8a84b;font-size:18px;margin:0;font-family:Georgia,serif"><span style="color:#fff">Elimu</span> Pay</h1>
        <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px">Platform announcement</p>
      </div>
      <div style="padding:28px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:16px;margin:0 0 16px">${subject}</h2>
        <div style="color:#475569;font-size:14px;line-height:1.7;white-space:pre-wrap">${message}</div>
      </div>
      <div style="padding:16px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay &middot; support@elimupay.co.ke</p>
      </div>
    </div>
  `

  let sentCount = 0
  for (const school of schools) {
    if (school.user?.email) {
      await sendEmail({ to: school.user.email, subject, html }).catch(() => {})
      sentCount++
    }
  }

  const record = await prisma.adminAnnouncement.create({
    data: {
      subject,
      message,
      recipientType: recipientType || 'all',
      recipientCount: sentCount,
      sentBy: user.name,
    },
  })

  return NextResponse.json({ success: true, sentCount, record })
}
