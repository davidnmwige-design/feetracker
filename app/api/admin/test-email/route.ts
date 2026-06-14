import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const to: string = body.to || session.user.email

  try {
    await sendEmail({
      to,
      subject: 'Elimu Pay — Test Email',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#0a1f4e;padding:24px;text-align:center">
            <h1 style="margin:0;font-family:Georgia,serif;font-size:22px">
              <span style="color:#fff">Elimu</span><span style="color:#c8a84b"> Pay</span>
            </h1>
          </div>
          <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
            <h2 style="color:#0f172a;font-size:18px">Email Test Successful</h2>
            <p style="color:#64748b;font-size:14px;line-height:1.6">
              Your email configuration is working correctly.<br>
              This test was sent from the admin panel.
            </p>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent at: ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
    })
    return NextResponse.json({ success: true, to })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({
      error: 'Email test failed',
      detail: process.env.NODE_ENV === 'development' ? msg : 'Check server logs.',
    }, { status: 500 })
  }
}
