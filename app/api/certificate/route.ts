import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = Number(searchParams.get('studentId'))

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { payments: true, school: true }
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0)
  const balance = student.feeRequired - totalPaid

  return NextResponse.json({
    student: {
      name: student.name,
      admNo: student.admNo,
      class: student.class,
      stream: student.stream,
      feeRequired: student.feeRequired,
      totalPaid,
      balance,
      cleared: balance <= 0
    },
    school: {
      name: student.school.name,
      term: student.school.term
    }
  })
}