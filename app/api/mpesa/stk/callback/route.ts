import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/encrypt'
import { sendEmail, paymentConfirmationHtml } from '@/lib/email'
import { logAudit } from '@/lib/audit'
import { secureEqual } from '@/lib/secureCompare'

const ACCEPTED = { ResultCode: 0, ResultDesc: 'Accepted' }

// Async result of an STK Push. Authenticated by the shared secret in the URL (same scheme as the
// C2B confirmation). Fails closed: always returns the "accepted" shape, never throws to Safaricom.
export async function POST(req: Request) {
  const expectedToken = process.env.DARAJA_CALLBACK_SECRET
  const providedToken = new URL(req.url).searchParams.get('t')
  if (!expectedToken || !secureEqual(providedToken, expectedToken)) {
    console.warn('[stk] Rejected callback: invalid or missing token')
    return NextResponse.json(ACCEPTED)
  }

  try {
    const body = await req.json()
    const cb = body?.Body?.stkCallback
    if (!cb?.CheckoutRequestID) return NextResponse.json(ACCEPTED)

    const { CheckoutRequestID, ResultCode, ResultDesc } = cb
    const stk = await prisma.stkRequest.findUnique({ where: { checkoutRequestId: String(CheckoutRequestID) } })
    if (!stk) {
      console.warn('[stk] No matching StkRequest for', CheckoutRequestID)
      return NextResponse.json(ACCEPTED)
    }
    if (stk.status !== 'pending') return NextResponse.json(ACCEPTED) // already processed (dedup)

    const code = Number(ResultCode)
    if (code !== 0) {
      // 1032 = user cancelled; anything else = failed/timeout/insufficient funds.
      await prisma.stkRequest.update({
        where: { id: stk.id },
        data: { status: code === 1032 ? 'cancelled' : 'failed', resultCode: code, resultDesc: ResultDesc ? String(ResultDesc) : null },
      })
      return NextResponse.json(ACCEPTED)
    }

    // Success — pull the metadata items.
    const items: { Name: string; Value?: string | number }[] = cb.CallbackMetadata?.Item || []
    const get = (name: string) => items.find(i => i.Name === name)?.Value
    const amount = Number(get('Amount') ?? stk.amount)
    const receipt = get('MpesaReceiptNumber') ? String(get('MpesaReceiptNumber')) : null
    const phone = get('PhoneNumber') ? String(get('PhoneNumber')) : stk.phone

    // Dedup on the M-Pesa receipt (callbacks can be retried).
    if (receipt) {
      const existing = await prisma.payment.findFirst({ where: { mpesaRef: receipt } })
      if (existing) {
        await prisma.stkRequest.update({ where: { id: stk.id }, data: { status: 'success', mpesaReceipt: receipt, resultCode: 0, resultDesc: ResultDesc ? String(ResultDesc) : null } })
        return NextResponse.json(ACCEPTED)
      }
    }

    await prisma.payment.create({
      data: {
        mpesaRef: receipt,
        amount,
        paidAt: new Date(),
        senderPhone: String(phone),
        matched: !!stk.studentId,
        studentId: stk.studentId ?? null,
        schoolId: stk.schoolId,
        source: 'stk',
      },
    })

    await prisma.stkRequest.update({
      where: { id: stk.id },
      data: { status: 'success', mpesaReceipt: receipt, resultCode: 0, resultDesc: ResultDesc ? String(ResultDesc) : null },
    })

    // Notify the parent, mirroring the C2B confirmation experience.
    if (stk.studentId) {
      const student = await prisma.student.findUnique({ where: { id: stk.studentId }, include: { payments: true, school: true } })
      if (student) {
        const paid = student.payments.reduce((s, p) => s + p.amount, 0)
        const balance = student.feeRequired - paid
        logAudit({ schoolId: stk.schoolId, action: 'STK_PAYMENT_RECEIVED', details: `KES ${amount} from ${phone} for ${student.name} via STK` }).catch(() => {})
        if (student.parentEmail) {
          try {
            const email = decrypt(student.parentEmail)
            if (email) {
              sendEmail({
                to: email,
                subject: `Payment received — ${student.name} — ${student.school.name}`,
                fromName: `${student.school.name} via Elimu Pay`,
                replyTo: student.school.replyToEmail || undefined,
                html: paymentConfirmationHtml({
                  schoolName: student.school.name,
                  parentName: student.parentName || 'Parent',
                  studentName: student.name,
                  studentClass: `${student.class}${student.stream ? ' ' + student.stream : ''}`,
                  amount,
                  balance,
                  paybill: student.school.paybill,
                  accountNumberFormat: student.school.accountNumberFormat,
                }),
              }).catch(err => console.error('[stk] email error:', err))
            }
          } catch { /* decryption failure — skip notification */ }
        }
      }
    }

    return NextResponse.json(ACCEPTED)
  } catch (err) {
    console.error('[stk] callback error:', err)
    return NextResponse.json(ACCEPTED)
  }
}
