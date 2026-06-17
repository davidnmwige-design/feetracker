import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { issueOrUpdateInvoice } from '@/lib/invoices'
import { renderInvoicePdf } from '@/lib/invoicePdf'
import { getEffectiveFee } from '@/lib/feeCalculations'
import { sendEmail, invoiceEmailHtml } from '@/lib/email'

// Server-side invoice issue + render + email. Generates the PDF in Node (off the browser
// main thread) and emails it to the parent. All financials are recomputed from the DB.
export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(ctx.role, 'invoices', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  try {
    const school = ctx.school
    const body = await req.json()
    const studentId = Number(body?.studentId)
    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: school.id },
      include: {
        payments: true,
        feeCategories: true,
        bursary: true,
        studentDiscounts: { include: { discount: true } },
      },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const totalPaid = student.payments.reduce((s, p) => s + p.amount, 0)
    const effectiveFee = getEffectiveFee(student.feeRequired, student.bursary, student.studentDiscounts)
    const totalDue = Math.max(0, effectiveFee - totalPaid)
    const cats = student.feeCategories.map(c => ({ name: c.name, amount: c.amount }))

    const breakdown = cats.length > 0
      ? { categories: cats, totalFee: student.feeRequired, totalPaid, totalDue }
      : {
          tuitionFee: student.tuitionFee, sportsFee: student.sportsFee,
          clubsFee: student.clubsFee, otherFee: student.otherFee,
          totalFee: student.feeRequired, totalPaid, totalDue,
        }

    // Assign/keep the sequential number, then render the PDF with it.
    const invoice = await issueOrUpdateInvoice(school, studentId, { status: 'sent', amount: totalDue, breakdown })

    const pdf = renderInvoicePdf({
      school,
      student: { ...student, effectiveFee },
      totalPaid,
      feeCategories: cats.length > 0 ? cats : undefined,
      invoiceNumber: invoice.invoiceNumber,
    })

    // The invoice is already issued+numbered above; email is best-effort delivery, so a
    // mail-server failure must not undo issuance — report it via the `emailed` flag instead.
    let emailed = false
    let emailError: string | undefined
    if (student.parentEmail) {
      const term = school.currentTerm || ''
      const dueDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      try {
        await sendEmail({
          to: student.parentEmail,
          subject: `Fee Invoice — ${student.name} — ${term} — ${school.name}`,
          fromName: school.name,
          html: invoiceEmailHtml({
            schoolName: school.name,
            parentName: student.parentName || 'Parent',
            studentName: student.name,
            term, totalDue, dueDateStr,
          }),
          pdfBase64: Buffer.from(pdf).toString('base64'),
          pdfFilename: `Invoice_${student.name.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}.pdf`,
        })
        emailed = true
      } catch (err) {
        emailError = 'Email delivery failed'
        console.error(`invoices send: email failed for student ${student.id}:`, err)
      }
    }

    logAudit({ schoolId: school.id, action: 'INVOICE_SENT', details: `Student: ${student.name} (${student.admNo}), Amount: ${totalDue}, emailed: ${emailed}` }).catch(() => {})
    return NextResponse.json({ invoice, emailed, emailError })
  } catch (err) {
    console.error('invoices send error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
