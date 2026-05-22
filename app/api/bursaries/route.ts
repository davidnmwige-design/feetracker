import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { parseBody, createBursarySchema } from '@/lib/schemas'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })
    if (!hasPermission(ctx.role, 'students', 'PATCH')) return NextResponse.json(FORBIDDEN, { status: 403 })

    let rawBody: unknown
    try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
    const parsed = parseBody(createBursarySchema, rawBody)
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { studentId, type, description, discountType, discountValue, approvedBy, endDate, active = true } = parsed.data

    // Verify student belongs to this school
    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { schoolId: true } })
    if (!student || student.schoolId !== ctx.school.id) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    // Upsert — each student has at most one bursary
    const bursary = await prisma.bursary.upsert({
      where: { studentId },
      update: {
        type, description: description || null, discountType, discountValue,
        approvedBy: approvedBy || null, endDate: endDate ? new Date(endDate) : null, active,
      },
      create: {
        studentId, type, description: description || null, discountType, discountValue,
        approvedBy: approvedBy || null, endDate: endDate ? new Date(endDate) : null,
      },
    })
    return NextResponse.json(bursary)
  } catch (err) {
    console.error('bursary POST error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
