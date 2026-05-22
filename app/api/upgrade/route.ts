import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { sendEmail } from '@/lib/email'
import { logAudit } from '@/lib/audit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

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

    if (!hasPermission(ctx.role, 'upgrade', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const body = await req.json()
    const requestedPlan = sanitize(body.requestedPlan || '', 50)
    const notes = sanitize(body.notes || '', 500)

    if (!['Growth', 'Premium', 'Enterprise'].includes(requestedPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const request = await prisma.planUpgradeRequest.create({
      data: {
        schoolId: ctx.school.id,
        currentPlan: ctx.school.currentPlan,
        requestedPlan,
        notes: notes || null,
      }
    })

    const adminHtml = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
        <div style="background:#0a1f4e;padding:24px;text-align:center">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:22px"><span style="color:#fff">Elimu</span><span style="color:#c8a84b"> Pay</span></h1>
          <p style="color:#94a3c8;margin:6px 0 0;font-size:12px">Plan Upgrade Request</p>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
          <h2 style="color:#0f172a;font-size:18px;margin-bottom:8px">New Plan Upgrade Request</h2>
          <p style="color:#64748b;font-size:14px">A school has requested a plan upgrade.</p>
          <div style="background:#f8f9fc;border-radius:8px;padding:20px;margin:20px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:13px">School</td>
                <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">${ctx.school.name}</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0">
                <td style="padding:8px 0;color:#64748b;font-size:13px">Admin email</td>
                <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">${session.user.email}</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0">
                <td style="padding:8px 0;color:#64748b;font-size:13px">Current plan</td>
                <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">${ctx.school.currentPlan}</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0">
                <td style="padding:8px 0;color:#64748b;font-size:13px">Requested plan</td>
                <td style="text-align:right;font-weight:700;color:#c8a84b;font-size:14px">${requestedPlan}</td>
              </tr>
              ${notes ? `<tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;color:#64748b;font-size:13px">Notes</td><td style="text-align:right;color:#0f172a;font-size:13px">${notes}</td></tr>` : ''}
            </table>
          </div>
          <p style="color:#64748b;font-size:13px">Log in to the admin panel to approve or reject this request.</p>
        </div>
        <div style="padding:16px;background:#f8f9fc;text-align:center">
          <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay &middot; support@elimupay.co.ke</p>
        </div>
      </div>
    `

    sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || 'davidnmwige@gmail.com',
      subject: `Plan Upgrade Request — ${ctx.school.name} (${ctx.school.currentPlan} → ${requestedPlan})`,
      html: adminHtml,
    }).catch(err => console.error('Upgrade email error:', err))

    logAudit({ userId: ctx.userId, schoolId: ctx.school.id, action: 'PLAN_UPGRADE_REQUESTED', details: `${ctx.school.currentPlan} → ${requestedPlan}`, ipAddress: getIp(req) }).catch(() => {})
    return NextResponse.json({ success: true, requestId: request.id, adminEmail: session.user.email })
  } catch (err) {
    console.error('upgrade POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
