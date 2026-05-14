import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return local[0] + '***@' + domain
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.oTPCode.deleteMany({ where: { userId: user.id, used: false } })
  await prisma.oTPCode.create({ data: { userId: user.id, code, expiresAt } })

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#0a1f4e;padding:24px;text-align:center">
        <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:22px">FeeTracker</h1>
        <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:12px">Security verification</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:18px;margin:0 0 12px">Your verification code</h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 28px">
          Hi ${user.name},<br>use the code below to verify your identity on FeeTracker.
        </p>
        <div style="background:#f8f9fc;border:2px solid #0a1f4e;border-radius:12px;padding:28px;text-align:center;margin-bottom:24px">
          <p style="font-size:40px;font-weight:700;letter-spacing:0.35em;color:#0a1f4e;margin:0;font-family:monospace">${code}</p>
        </div>
        <p style="color:#94a3b8;font-size:13px;margin:0">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
      <div style="padding:16px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">FeeTracker &middot; support@feetracker.co.ke</p>
      </div>
    </div>
  `

  await sendEmail({ to: user.email, subject: 'Your FeeTracker verification code', html })

  return NextResponse.json({ success: true, maskedEmail: maskEmail(user.email) })
}
