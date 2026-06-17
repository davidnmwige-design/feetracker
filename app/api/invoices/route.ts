import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { parsePagination, paginatedResponse } from '@/lib/pagination'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(ctx.role, 'invoices', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

  try {
    const url = new URL(req.url)
    const term = url.searchParams.get('term') || ctx.school.currentTerm
    const pg = parsePagination(url.searchParams)
    const where = { schoolId: ctx.school.id, term }

    if (pg.paginated) {
      const [total, invoices] = await Promise.all([
        prisma.invoice.count({ where }),
        prisma.invoice.findMany({ where, skip: pg.skip, take: pg.take, orderBy: { id: 'asc' } }),
      ])
      return NextResponse.json(paginatedResponse(invoices, total, pg))
    }

    const invoices = await prisma.invoice.findMany({ where })
    return NextResponse.json(invoices)
  } catch (err) {
    console.error('invoices GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

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
    const { studentId, status, amount, breakdown } = body
    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    const student = await prisma.student.findFirst({
      where: { id: Number(studentId), schoolId: school.id },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const term = school.currentTerm
    const sid = Number(studentId)
    const existing = await prisma.invoice.findUnique({
      where: { studentId_term: { studentId: sid, term } },
    })

    let invoice
    if (existing) {
      // Re-send / re-save: never re-number an already-issued invoice.
      invoice = await prisma.invoice.update({
        where: { id: existing.id },
        data: {
          status: status || 'sent',
          sentAt: status === 'sent' ? new Date() : undefined,
          amount: Number(amount),
          breakdown: breakdown ?? {},
        },
      })
    } else {
      // First issue: atomically claim the next sequential number for this school.
      // The increment is a single UPDATE that returns the post-increment value, so
      // concurrent issues each get a distinct, gap-free number (within the txn).
      invoice = await prisma.$transaction(async (tx) => {
        const sc = await tx.school.update({
          where: { id: school.id },
          data: { nextInvoiceNumber: { increment: 1 } },
          select: { nextInvoiceNumber: true },
        })
        return tx.invoice.create({
          data: {
            studentId: sid,
            schoolId: school.id,
            term,
            status: status || 'sent',
            sentAt: status === 'sent' ? new Date() : null,
            amount: Number(amount),
            breakdown: breakdown ?? {},
            invoiceNumber: sc.nextInvoiceNumber - 1,
          },
        })
      })
    }
    if (status === 'sent') {
      logAudit({ schoolId: school.id, action: 'INVOICE_SENT', details: `Student: ${student.name} (${student.admNo}), Amount: ${amount}` }).catch(() => {})
    }
    return NextResponse.json(invoice)
  } catch (err) {
    console.error('invoices POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
