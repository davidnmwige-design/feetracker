import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { sendEmail } from '@/lib/email'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { validateEmail, validateText } from '@/lib/validation'

const MAX_HTML_SIZE = 100 * 1024 // 100 KB

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

    const body = await req.json()

    const toResult = validateEmail(body.to)
    if (!toResult.valid) return NextResponse.json({ error: toResult.error }, { status: 400 })

    const subjectResult = validateText(body.subject, 'Subject', 200, true)
    if (!subjectResult.valid) return NextResponse.json({ error: subjectResult.error }, { status: 400 })

    const html = typeof body.html === 'string' ? body.html : ''
    if (!html) return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
    if (html.length > MAX_HTML_SIZE) return NextResponse.json({ error: 'Email body is too large' }, { status: 413 })

    const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64 : undefined
    const pdfFilename = sanitize(body.pdfFilename || 'certificate.pdf', 200)
    const schoolName = sanitize(body.schoolName || '', 200)
    const replyTo = sanitize(body.replyTo || '', 200)
    const fromName = schoolName ? `${schoolName} via Elimu Pay` : undefined

    await sendEmail({ to: toResult.sanitized, subject: subjectResult.sanitized, html, fromName, replyTo: replyTo || undefined, pdfBase64, pdfFilename })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-email error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
