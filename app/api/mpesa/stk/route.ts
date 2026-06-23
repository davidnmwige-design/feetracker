import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { initiateStkPush, stkConfigured } from '@/lib/daraja'
import { normalizePhoneForWhatsApp } from '@/lib/phoneUtils'

// Staff-initiated M-Pesa STK Push: prompts a parent's phone to pay fees. The CheckoutRequestID
// is persisted (StkRequest) so the async callback can correlate the result back to the student.
export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(ctx.role, 'mpesa/stk', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  if (!stkConfigured()) {
    return NextResponse.json({ error: 'M-Pesa STK Push is not configured. Add the Daraja credentials and passkey in your environment settings.' }, { status: 400 })
  }

  try {
    const school = ctx.school
    const body = await req.json()
    const studentId = Number(body?.studentId)
    const amount = Math.round(Number(body?.amount))
    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })
    if (!amount || amount < 1) return NextResponse.json({ error: 'Amount must be at least KES 1' }, { status: 400 })

    const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: school.id } })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const rawPhone = (body?.phone || student.parentPhone || '').toString()
    const msisdn = rawPhone ? normalizePhoneForWhatsApp(rawPhone) : ''
    if (!/^254(7|1)\d{8}$/.test(msisdn)) {
      return NextResponse.json({ error: 'A valid Safaricom phone number is required (07XX XXX XXX).' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://elimupay.co.ke'
    const callbackUrl = `${appUrl}/api/mpesa/stk/callback?t=${process.env.DARAJA_CALLBACK_SECRET || ''}`

    const resp = await initiateStkPush({
      shortcode: process.env.DARAJA_SHORTCODE!,
      passkey: process.env.DARAJA_PASSKEY!,
      amount,
      phone: msisdn,
      callbackUrl,
      accountReference: student.admNo || `STU${student.id}`,
      description: 'School Fees',
    })

    if (!resp.CheckoutRequestID) {
      console.error('[stk] No CheckoutRequestID in response:', resp)
      return NextResponse.json({ error: resp.ResponseDescription || 'Failed to initiate payment' }, { status: 502 })
    }

    await prisma.stkRequest.create({
      data: {
        checkoutRequestId: resp.CheckoutRequestID,
        merchantRequestId: resp.MerchantRequestID || null,
        schoolId: school.id,
        studentId: student.id,
        amount,
        phone: msisdn,
        status: 'pending',
      },
    })

    logAudit({ schoolId: school.id, action: 'STK_PUSH_INITIATED', details: `KES ${amount} to ${msisdn} for ${student.name} (${student.admNo})` }).catch(() => {})

    return NextResponse.json({
      ok: true,
      checkoutRequestId: resp.CheckoutRequestID,
      customerMessage: resp.CustomerMessage || 'Payment request sent to the parent\'s phone.',
    })
  } catch (err) {
    console.error('[stk] initiate error:', err)
    return NextResponse.json({ error: 'Failed to initiate payment. Please try again.' }, { status: 502 })
  }
}
