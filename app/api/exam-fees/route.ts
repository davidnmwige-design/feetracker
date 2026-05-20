import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { sanitize } from '@/lib/sanitize'

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
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const body = await req.json()
  const name = sanitize(body.name, 120)
  const examType = sanitize(body.examType, 50)
  const amount = parseFloat(body.amount) || 0
  const targetClass = sanitize(body.targetClass, 50)

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!examType) return NextResponse.json({ error: 'Exam type is required' }, { status: 400 })
  if (amount <= 0) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  if (!targetClass) return NextResponse.json({ error: 'Target class is required' }, { status: 400 })

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
