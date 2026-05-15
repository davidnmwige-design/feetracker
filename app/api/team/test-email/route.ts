import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const emailUser = process.env.EMAIL_USER || null
  const emailPassSet = !!(process.env.EMAIL_PASS && process.env.EMAIL_PASS.length > 0)

  const diagnostics = {
    EMAIL_USER: emailUser ?? '(not set)',
    EMAIL_PASS: emailPassSet ? '(set)' : '(NOT SET — this is why emails are not sending)',
    emailConfigured: !!(emailUser && emailPassSet),
  }

  if (!emailUser || !emailPassSet) {
    return NextResponse.json({
      success: false,
      reason: 'Email not configured — EMAIL_USER or EMAIL_PASS missing from environment',
      diagnostics,
      fix: 'Add EMAIL_USER (Gmail address) and EMAIL_PASS (Gmail App Password) to your .env and Vercel environment variables',
    })
  }

  try {
    const nodemailer = (await import('nodemailer')).default
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: emailUser, pass: process.env.EMAIL_PASS },
    })

    console.log('[test-email] Verifying SMTP connection…')
    await transporter.verify()
    console.log('[test-email] SMTP connection verified')

    await transporter.sendMail({
      from: `"Elimu Pay Test" <${emailUser}>`,
      to: emailUser,
      subject: 'Elimu Pay — Email test successful',
      html: '<p>If you received this, email is working correctly.</p>',
    })

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${emailUser}`,
      diagnostics,
    })
  } catch (err: any) {
    console.error('[test-email] error:', err)
    return NextResponse.json({
      success: false,
      reason: err?.message || 'Unknown error',
      diagnostics,
    })
  }
}
