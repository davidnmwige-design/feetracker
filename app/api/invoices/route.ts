import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'

async function getSchoolUser(req: Request) {
  if (!checkRateLimit(getIp(req))) return null
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { school: true },
  })
  return user?.school ? user : null
}

export async function GET(req: Request) {
  const user = await getSchoolUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id, user.school!)
  if (!hasPermission(role, 'invoices', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

  try {
    const url = new URL(req.url)
    const term = url.searchParams.get('term') || user.school!.currentTerm

    const invoices = await prisma.invoice.findMany({
      where: { schoolId: user.school!.id, term },
    })
    return NextResponse.json(invoices)
  } catch (err) {
    console.error('invoices GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getSchoolUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = await getUserRole(user.id, user.school!)
  if (!hasPermission(role, 'invoices', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  try {
    const school = user.school!
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
