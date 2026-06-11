import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { decrypt } from '@/lib/encrypt'
import { sendEmail, paymentConfirmationHtml } from '@/lib/email'
import { logAudit } from '@/lib/audit'
import { secureEqual } from '@/lib/secureCompare'
import { checkRateLimitAsync, getDarajaLimiter } from '@/lib/ratelimit'

const ACCEPTED = { ResultCode: 0, ResultDesc: 'Accepted' }

export async function POST(req: Request) {
  // Authenticate the Safaricom callback via the shared secret embedded in the URL we
  // registered (see /api/daraja/register). Without it, anyone could inject fake payments.
  // Fail closed: respond with the normal "accepted" shape but do no processing, so an
  // attacker gets no signal and Safaricom is not triggered to retry.
  const expectedToken = process.env.DARAJA_CALLBACK_SECRET
  const providedToken = new URL(req.url).searchParams.get('t')
  if (!expectedToken || !secureEqual(providedToken, expectedToken)) {
    console.warn('[daraja] Rejected confirmation: invalid or missing callback token')
    return NextResponse.json(ACCEPTED)
  }

  try {
    const body = await req.json()
    const {
      TransID,
      TransAmount,
      BusinessShortCode,
      BillRefNumber,
      MSISDN,
      FirstName,
      MiddleName,
      LastName,
    } = body

    // Rate limit per paybill so one shortcode cannot flood the platform (or another tenant).
    const rl = await checkRateLimitAsync(getDarajaLimiter(), `daraja:${BusinessShortCode}`)
    if (!rl.success) {
      console.warn('[daraja] Rate limit exceeded for paybill:', BusinessShortCode)
      return NextResponse.json(ACCEPTED)
    }

    // 1. Find school by paybill
    const school = await prisma.school.findFirst({
      where: { paybill: String(BusinessShortCode) },
      include: { students: { include: { payments: true } } },
    })

    if (!school) {
      console.error('[daraja] No school found for paybill:', BusinessShortCode)
      return NextResponse.json(ACCEPTED)
    }

    // 2. Dedup check
    if (TransID) {
      const existing = await prisma.payment.findFirst({ where: { mpesaRef: String(TransID) } })
      if (existing) {
        console.log('[daraja] Duplicate transaction:', TransID)
        return NextResponse.json(ACCEPTED)
      }
    }

    // 3. Attempt to match student
    const ref = (BillRefNumber || '').trim().replace(/\s+/g, '').toUpperCase()
    let matchedStudent: (typeof school.students)[0] | null = null

    if (ref) {
      // Step 1: exact admNo match
      matchedStudent = school.students.find(
        s => (s.admNo || '').trim().toUpperCase() === ref
      ) ?? null

      // Step 2: partial match
      if (!matchedStudent) {
        matchedStudent = school.students.find(s => {
          const admNo = (s.admNo || '').trim().toUpperCase()
          return admNo.includes(ref) || ref.includes(admNo)
        }) ?? null
      }
    }

    // Step 3: phone match
    if (!matchedStudent && MSISDN) {
      const phone = String(MSISDN).replace(/\D/g, '')
      matchedStudent = school.students.find(s => {
        const p1 = (s.parentPhone || '').replace(/\D/g, '')
        const p2 = (s.parent2Phone || '').replace(/\D/g, '')
        return (p1 && phone.endsWith(p1.slice(-9))) || (p2 && phone.endsWith(p2.slice(-9)))
      }) ?? null
    }

    // 4. Create payment record
    const senderName = [FirstName, MiddleName, LastName].filter(Boolean).join(' ').trim()
    const payment = await prisma.payment.create({
      data: {
        mpesaRef: TransID ? String(TransID) : null,
        amount: Number(TransAmount),
        paidAt: new Date(),
        senderName: senderName || null,
        senderPhone: MSISDN ? String(MSISDN) : null,
        matched: !!matchedStudent,
        studentId: matchedStudent?.id ?? null,
        schoolId: school.id,
        source: 'daraja',
      },
    })

    // 5. If matched: send notifications
    if (matchedStudent) {
      const paid = matchedStudent.payments.reduce((s, p) => s + p.amount, 0) + Number(TransAmount)
      const balance = matchedStudent.feeRequired - paid

      logAudit({
        schoolId: school.id,
        action: 'DARAJA_PAYMENT_RECEIVED',
        details: `KES ${TransAmount} from ${senderName || MSISDN} for ${matchedStudent.name} via Daraja`,
      }).catch(() => {})

      // Email notification
      if (matchedStudent.parentEmail) {
        try {
          const email = decrypt(matchedStudent.parentEmail)
          if (email) {
            sendEmail({
              to: email,
              subject: `Payment received — ${matchedStudent.name} — ${school.name}`,
              fromName: `${school.name} via Elimu Pay`,
              replyTo: (school as any).replyToEmail || undefined,
              html: paymentConfirmationHtml({
                schoolName: school.name,
                parentName: matchedStudent.parentName || 'Parent',
                studentName: matchedStudent.name,
                studentClass: `${matchedStudent.class}${matchedStudent.stream ? ' ' + matchedStudent.stream : ''}`,
                amount: Number(TransAmount),
                balance,
                paybill: school.paybill,
                accountNumberFormat: (school as any).accountNumberFormat,
              }),
            }).catch(err => console.error('[daraja] Email error:', err))
          }
        } catch { /* decryption failure — skip */ }
      }
    }

    return NextResponse.json(ACCEPTED)
  } catch (err) {
    console.error('[daraja] confirmation error:', err)
    return NextResponse.json(ACCEPTED) // ALWAYS return accepted
  }
}
