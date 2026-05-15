import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { sanitize } from '@/lib/sanitize'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })
    if (!hasPermission(ctx.role, 'students', 'PATCH')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const body = await req.json()
    const { studentId, type, description, discountType, discountValue, approvedBy, endDate } = body

    if (!studentId || !type || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify student belongs to this school
    const student = await prisma.student.findUnique({ where: { id: Number(studentId) }, select: { schoolId: true } })
    if (!student || student.schoolId !== ctx.school.id) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    // Upsert — each student has at most one bursary
    const bursary = await prisma.bursary.upsert({
      where: { studentId: Number(studentId) },
      update: {
        type: sanitize(type, 50),
        description: description ? sanitize(description, 200) : null,
        discountType: sanitize(discountType, 20),
        discountValue: Number(discountValue),
        approvedBy: approvedBy ? sanitize(approvedBy, 100) : null,
        endDate: endDate ? new Date(endDate) : null,
        active: true,
      },
      create: {
        studentId: Number(studentId),
        type: sanitize(type, 50),
        description: description ? sanitize(description, 200) : null,
        discountType: sanitize(discountType, 20),
        discountValue: Number(discountValue),
        approvedBy: approvedBy ? sanitize(approvedBy, 100) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })
    return NextResponse.json(bursary)
  } catch (err) {
    console.error('bursary POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
