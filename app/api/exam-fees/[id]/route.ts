export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'
import { parseBody, updateExamFeeSchema } from '@/lib/schemas'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { id } = await params
  const feeId = parseInt(id)
  const existing = await prisma.examFee.findFirst({ where: { id: feeId, schoolId: ctx.school.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
  const parsed = parseBody(updateExamFeeSchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const body = parsed.data

  // Handle assign action separately
  if (body.assign === true) {
    const students = await prisma.student.findMany({
      where: { schoolId: ctx.school.id, class: existing.targetClass },
      select: { id: true },
    })
    let assigned = 0
    for (const s of students) {
      try {
        await prisma.studentExamFee.create({ data: { studentId: s.id, examFeeId: feeId } })
        assigned++
      } catch { /* already exists */ }
    }
    return NextResponse.json({ assigned })
  }

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.examType !== undefined) data.examType = body.examType
  if (body.amount !== undefined) data.amount = body.amount
  if (body.targetClass !== undefined) data.targetClass = body.targetClass
  if (body.active !== undefined) data.active = body.active

  const updated = await prisma.examFee.update({ where: { id: feeId }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { id } = await params
  const feeId = parseInt(id)
  const existing = await prisma.examFee.findFirst({ where: { id: feeId, schoolId: ctx.school.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.examFee.delete({ where: { id: feeId } })
  return NextResponse.json({ success: true })
}
