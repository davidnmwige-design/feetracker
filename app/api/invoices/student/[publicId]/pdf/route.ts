import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { renderInvoicePdf } from '@/lib/invoicePdf'
import { getEffectiveFee } from '@/lib/feeCalculations'

// Stream an invoice PDF for a student, rendered server-side. Uses the saved invoice's sequential
// number when one has been issued (current term); otherwise renders a preview. School-scoped.
export async function GET(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(ctx.role, 'invoices', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const { publicId } = await params

  const student = await prisma.student.findFirst({
    where: { publicId, schoolId: ctx.school.id },
    include: {
      payments: true,
      feeCategories: true,
      bursary: true,
      studentDiscounts: { include: { discount: true } },
    },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const invoice = await prisma.invoice.findUnique({
    where: { studentId_term: { studentId: student.id, term: ctx.school.currentTerm } },
  })

  const totalPaid = student.payments.reduce((s, p) => s + p.amount, 0)
  const effectiveFee = getEffectiveFee(student.feeRequired, student.bursary, student.studentDiscounts)
  const cats = student.feeCategories.map(c => ({ name: c.name, amount: c.amount }))

  const pdf = renderInvoicePdf({
    school: ctx.school,
    student: { ...student, effectiveFee },
    totalPaid,
    feeCategories: cats.length > 0 ? cats : undefined,
    invoiceNumber: invoice?.invoiceNumber ?? null,
  })

  const label = invoice?.invoiceNumber != null
    ? `INV-${String(invoice.invoiceNumber).padStart(5, '0')}`
    : `Invoice_${(student.admNo || student.publicId).toString().replace(/\//g, '-')}`
  return new Response(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${label}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
