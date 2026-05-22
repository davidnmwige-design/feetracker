export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { sanitize } from '@/lib/sanitize'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { parseBody, createExamFeeSchema } from '@/lib/schemas'

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

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
  const parsed = parseBody(createExamFeeSchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { name, examType, amount, targetClass, academicYear, dueDate, active = true } = parsed.data

  if (amount <= 0) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })

  const fee = await prisma.examFee.create({
    data: {
      schoolId: ctx.school.id,
      name,
      examType,
      amount,
      targetClass,
      academicYear: academicYear ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      active,
    },
  })
  return NextResponse.json(fee, { status: 201 })
}
