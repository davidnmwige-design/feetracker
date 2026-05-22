export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const studentId = parseInt(searchParams.get('studentId') || '')
  if (isNaN(studentId)) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: ctx.school.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const applied = await prisma.studentDiscount.findMany({
    where: { studentId },
    include: { discount: true },
  })
  return NextResponse.json(applied)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const body = await req.json()
  const discountId = parseInt(body.discountId)
  const studentIds: number[] = Array.isArray(body.studentIds) ? body.studentIds.map(Number) : []

  if (isNaN(discountId) || studentIds.length === 0) {
    return NextResponse.json({ error: 'discountId and studentIds are required' }, { status: 400 })
  }

  const discount = await prisma.feeDiscount.findFirst({ where: { id: discountId, schoolId: ctx.school.id } })
  if (!discount) return NextResponse.json({ error: 'Discount not found' }, { status: 404 })

  let applied = 0
  let skipped = 0
  for (const studentId of studentIds) {
    const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: ctx.school.id } })
    if (!student) { skipped++; continue }
    try {
      await prisma.studentDiscount.create({
        data: { studentId, discountId, appliedBy: session.user.email },
      })
      applied++
    } catch {
      skipped++
    }
  }

  return NextResponse.json({ applied, skipped })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'School not found' }, { status: 404 })

  const body = await req.json()
  const discountId = parseInt(body.discountId)
  const studentId = parseInt(body.studentId)

  if (isNaN(discountId) || isNaN(studentId)) {
    return NextResponse.json({ error: 'discountId and studentId are required' }, { status: 400 })
  }

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: ctx.school.id } })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  await prisma.studentDiscount.deleteMany({ where: { studentId, discountId } })
  return NextResponse.json({ success: true })
}
