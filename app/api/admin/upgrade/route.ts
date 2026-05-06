import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sendEmail } from '@/lib/email'

const PLAN_DETAILS: Record<string, { monthly: number; maxStudents: number }> = {
  Starter: { monthly: 4500, maxStudents: 300 },
  Growth: { monthly: 6500, maxStudents: 600 },
  Premium: { monthly: 9000, maxStudents: 1000 },
}

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const requests = await prisma.planUpgradeRequest.findMany({
      where: { status: 'pending' },
      include: { school: { include: { user: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (err) {
    console.error('admin upgrade GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user?.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const requestId = Number(body.requestId)
    const action = body.action as 'approve' | 'reject'

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const upgradeRequest = await prisma.planUpgradeRequest.findUnique({
      where: { id: requestId },
      include: { school: { include: { user: true } } }
    })
    if (!upgradeRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    await prisma.planUpgradeRequest.update({
      where: { id: requestId },
      data: { status: action === 'approve' ? 'approved' : 'rejected' }
    })

    if (action === 'approve') {
      await prisma.school.update({
        where: { id: upgradeRequest.schoolId },
        data: { currentPlan: upgradeRequest.requestedPlan }
      })

      const newPlan = PLAN_DETAILS[upgradeRequest.requestedPlan] || PLAN_DETAILS['Starter']

      const approvalHtml = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#0a1f4e;padding:24px;text-align:center">
            <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:22px">FeeTracker</h1>
            <p style="color:#94a3c8;margin:6px 0 0;font-size:12px">${upgradeRequest.school.name}</p>
          </div>
          <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
            <h2 style="color:#0a7c3e;font-size:18px;margin-bottom:8px">Plan Upgraded!</h2>
            <p style="color:#64748b;font-size:14px;line-height:1.6">
              Your FeeTracker plan has been upgraded to <strong>${upgradeRequest.requestedPlan}</strong>.
            </p>
            <div style="background:#f8f9fc;border-radius:8px;padding:20px;margin:20px 0">
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="padding:8px 0;color:#64748b;font-size:13px">New plan</td>
                  <td style="text-align:right;font-weight:700;color:#c8a84b;font-size:14px">${upgradeRequest.requestedPlan}</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0">
                  <td style="padding:8px 0;color:#64748b;font-size:13px">Student capacity</td>
                  <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">Up to ${newPlan.maxStudents} students</td>
                </tr>
                <tr style="border-top:1px solid #e2e8f0">
                  <td style="padding:8px 0;color:#64748b;font-size:13px">Monthly fee</td>
                  <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">KES ${newPlan.monthly.toLocaleString()}/month</td>
                </tr>
              </table>
            </div>
            <p style="color:#64748b;font-size:13px">Log in to your FeeTracker dashboard to continue managing your school fees.</p>
          </div>
          <div style="padding:16px;background:#f8f9fc;text-align:center">
            <p style="color:#94a3b8;font-size:11px;margin:0">FeeTracker &middot; support@feetracker.co.ke</p>
          </div>
        </div>
      `

      sendEmail({
        to: upgradeRequest.school.user.email,
        subject: `Your plan has been upgraded to ${upgradeRequest.requestedPlan} — FeeTracker`,
        html: approvalHtml,
      }).catch(err => console.error('Approval email error:', err))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('admin upgrade PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
