import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

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

    const invoices = await prisma.invoice.findMany({
      where: { schoolId: ctx.school.id, term },
    })
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
    const invoice = await prisma.invoice.upsert({
      where: { studentId_term: { studentId: Number(studentId), term } },
      update: {
        status: status || 'sent',
        sentAt: status === 'sent' ? new Date() : undefined,
        amount: Number(amount),
        breakdown: breakdown ?? {},
      },
      create: {
        studentId: Number(studentId),
        schoolId: school.id,
        term,
        status: status || 'sent',
        sentAt: status === 'sent' ? new Date() : null,
        amount: Number(amount),
        breakdown: breakdown ?? {},
      },
    })
    if (status === 'sent') {
      logAudit({ schoolId: school.id, action: 'INVOICE_SENT', details: `Student: ${student.name} (${student.admNo}), Amount: ${amount}` }).catch(() => {})
    }
    return NextResponse.json(invoice)
  } catch (err) {
    console.error('invoices POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
