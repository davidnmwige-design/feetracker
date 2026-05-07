import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const to = sanitize(body.to || '', 200).toLowerCase()
    const subject = sanitize(body.subject || '', 500)
    const html = typeof body.html === 'string' ? body.html : ''
    const pdfBase64 = typeof body.pdfBase64 === 'string' ? body.pdfBase64 : undefined
    const pdfFilename = sanitize(body.pdfFilename || 'certificate.pdf', 200)
    const schoolName = sanitize(body.schoolName || '', 200)
    const replyTo = sanitize(body.replyTo || '', 200)
    const fromName = schoolName ? `${schoolName} via FeeTracker` : undefined

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, html' }, { status: 400 })
    }

    await sendEmail({ to, subject, html, fromName, replyTo: replyTo || undefined, pdfBase64, pdfFilename })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('send-email error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
