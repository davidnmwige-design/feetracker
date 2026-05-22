export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const body = await req.json()
  const discountId = parseInt(body.discountId)
  const parentPhone = typeof body.parentPhone === 'string' ? body.parentPhone.trim() : ''

  if (isNaN(discountId) || !parentPhone) {
    return NextResponse.json({ error: 'discountId and parentPhone are required' }, { status: 400 })
  }

  const discount = await prisma.feeDiscount.findFirst({ where: { id: discountId, schoolId: ctx.school.id } })
  if (!discount) return NextResponse.json({ error: 'Discount not found' }, { status: 404 })

  const students = await prisma.student.findMany({
    where: {
      schoolId: ctx.school.id,
      OR: [{ parentPhone: parentPhone }, { parent2Phone: parentPhone }],
    },
    select: { id: true },
  })

  let applied = 0
  for (const student of students) {
    try {
      await prisma.studentDiscount.create({
        data: { studentId: student.id, discountId, appliedBy: session.user.email },
      })
      applied++
    } catch {
      // Already applied â€” skip
    }
  }

  return NextResponse.json({ applied })
}
