import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sendEmail } from '@/lib/email'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { parseBody, sendEmailSchema } from '@/lib/schemas'

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
    if (ctx) {
      if (!hasPermission(ctx.role, 'send-email', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })
    }

    let rawBody: unknown
    try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
    const parsed = parseBody(sendEmailSchema, rawBody)
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { to, subject, html, pdfBase64, pdfFilename, schoolName, replyTo } = parsed.data

    const fromName = schoolName ? `${schoolName} via Elimu Pay` : undefined

    await sendEmail({ to, subject, html, fromName, replyTo: replyTo || undefined, pdfBase64, pdfFilename: pdfFilename || 'certificate.pdf' })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-email error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
