import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'
import { sendEmail } from '@/lib/email'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, email: true, twoFactorEnabled: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (err) {
    console.error('account GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (user.school) {
      const role = await getUserRole(user.id, user.school)
      if (!hasPermission(role, 'account', 'DELETE')) return NextResponse.json(FORBIDDEN, { status: 403 })
    }

    // Log before deletion so we have a record
    await logAudit({
      userId: user.id,
      schoolId: user.school?.id,
      action: 'ACCOUNT_DELETED',
      details: `School: ${user.school?.name ?? 'none'}`,
      ipAddress: getIp(req),
    })

    const settings = await prisma.platformSettings.findUnique({ where: { id: 1 } })
    if (settings?.notifyAccountDeleted !== false) {
      sendEmail({
        to: 'davidnmwige@gmail.com',
        subject: `Account deleted: ${user.school?.name || user.email}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#050f2c;padding:20px 24px">
            <h1 style="color:#c8a84b;font-size:16px;margin:0;font-weight:700;letter-spacing:1px">ELIMU PAY</h1>
            <p style="color:#94a3b8;font-size:11px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase">Account deleted</p>
          </div>
          <div style="padding:24px;background:#fff;border:1px solid #e2e8f0">
            <p style="color:#0f172a;font-size:15px;font-weight:700;margin:0 0 16px">A school account has been deleted.</p>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">School</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${user.school?.name || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b;border-bottom:1px solid #f1f5f9">Admin name</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right;border-bottom:1px solid #f1f5f9">${user.name}</td></tr>
              <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0;font-weight:600;color:#0f172a;text-align:right">${user.email}</td></tr>
            </table>
          </div>
          <div style="padding:14px 24px;background:#f8f9fc;text-align:center">
            <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay Platform &middot; Admin notification</p>
          </div>
        </div>`
      }).catch(err => console.error('account deletion notification error:', err))
    }

    if (user.school) {
      const schoolId = user.school.id
      await prisma.invoice.deleteMany({ where: { schoolId } })
      await prisma.payment.deleteMany({ where: { schoolId } })
      await prisma.student.deleteMany({ where: { schoolId } })
      await prisma.term.deleteMany({ where: { schoolId } })
      await prisma.planUpgradeRequest.deleteMany({ where: { schoolId } })
      await prisma.schoolNote.deleteMany({ where: { schoolId } })
      await prisma.billingRecord.deleteMany({ where: { schoolId } })
      await prisma.school.delete({ where: { id: schoolId } })
    }
    await prisma.passwordReset.deleteMany({ where: { email: user.email } })
    await prisma.user.delete({ where: { id: user.id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('account DELETE error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
