export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { sanitize } from '@/lib/sanitize'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { validateName, validateEnum, validateAmount } from '@/lib/validation'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const fees = await prisma.examFee.findMany({
    where: { schoolId: ctx.school.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { studentExamFees: true } } },
  })
  return NextResponse.json(fees)
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const body = await req.json()

  const nameResult = validateName(body.name, 'Exam fee name', 120)
  if (!nameResult.valid) return NextResponse.json({ error: nameResult.error }, { status: 400 })

  const typeResult = validateEnum(body.examType, ['KCSE', 'KCPE', 'Mock', 'Cambridge', 'Other'], 'Exam type')
  if (!typeResult.valid) return NextResponse.json({ error: typeResult.error }, { status: 400 })

  const amountResult = validateAmount(body.amount, 'Amount')
  if (!amountResult.valid) return NextResponse.json({ error: amountResult.error }, { status: 400 })
  if (amountResult.sanitized <= 0) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })

  const targetClass = sanitize(body.targetClass, 50)
  if (!targetClass) return NextResponse.json({ error: 'Target class is required' }, { status: 400 })

  const name = nameResult.sanitized
  const examType = typeResult.sanitized as string
  const amount = amountResult.sanitized as number

  const fee = await prisma.examFee.create({
    data: {
      schoolId: ctx.school.id,
      name,
      examType,
      amount,
      targetClass,
      academicYear: body.academicYear ? parseInt(body.academicYear) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      active: true,
    },
  })
  return NextResponse.json(fee, { status: 201 })
}
