import { prisma } from '@/lib/prisma'

// Shared invoice issuance — used by POST /api/invoices and POST /api/invoices/send.
// A sequential number is claimed atomically on first issue (transactional increment-and-
// return on the school counter), so concurrent issues get distinct, gap-free numbers.
// Re-sends/edits update in place and never re-number.

export async function issueOrUpdateInvoice(
  school: { id: number; currentTerm: string },
  studentId: number,
  data: { status?: string; amount: number; breakdown: unknown },
) {
  const term = school.currentTerm
  const existing = await prisma.invoice.findUnique({
    where: { studentId_term: { studentId, term } },
  })

  if (existing) {
    return prisma.invoice.update({
      where: { id: existing.id },
      data: {
        status: data.status || 'sent',
        sentAt: data.status === 'sent' ? new Date() : undefined,
        amount: data.amount,
        breakdown: (data.breakdown ?? {}) as object,
      },
    })
  }

  return prisma.$transaction(async (tx) => {
    const sc = await tx.school.update({
      where: { id: school.id },
      data: { nextInvoiceNumber: { increment: 1 } },
      select: { nextInvoiceNumber: true },
    })
    return tx.invoice.create({
      data: {
        studentId,
        schoolId: school.id,
        term,
        status: data.status || 'sent',
        sentAt: data.status === 'sent' ? new Date() : null,
        amount: data.amount,
        breakdown: (data.breakdown ?? {}) as object,
        invoiceNumber: sc.nextInvoiceNumber - 1,
      },
    })
  })
}
