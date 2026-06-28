import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET(_req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { publicId } = await params

  const student = await prisma.student.findFirst({
    where: { publicId, schoolId: ctx.school.id },
    select: { id: true },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const fees = await prisma.studentExamFee.findMany({
    where: { studentId: student.id },
    include: { examFee: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(fees)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { publicId } = await params
  const body = await req.json()
  const examFeeId = parseInt(body.examFeeId)

  const student = await prisma.student.findFirst({
    where: { publicId, schoolId: ctx.school.id },
    select: { id: true },
  })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const updated = await prisma.studentExamFee.update({
    where: { studentId_examFeeId: { studentId: student.id, examFeeId } },
    data: {
      paid: body.paid === true,
      paidAt: body.paid === true ? new Date() : null,
      paidAmount: body.paidAmount ? parseFloat(body.paidAmount) : null,
    },
  })
  return NextResponse.json(updated)
}
