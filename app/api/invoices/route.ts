import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'

async function getSchool(req: Request) {
  if (!checkRateLimit(getIp(req))) return null
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { school: true },
  })
  return user?.school ?? null
}

export async function GET(req: Request) {
  const school = await getSchool(req)
  if (!school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const term = url.searchParams.get('term') || school.currentTerm

  const invoices = await prisma.invoice.findMany({
    where: { schoolId: school.id, term },
  })
  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const school = await getSchool(req)
  if (!school) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  return NextResponse.json(invoice)
}
