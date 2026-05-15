import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { logAudit } from '@/lib/audit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) {
      return NextResponse.json({ error: 'No school found' }, { status: 400 })
    }

    if (!hasPermission(ctx.role, 'certificate', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const { searchParams } = new URL(req.url)
    const studentId = Number(searchParams.get('studentId'))

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { payments: true, school: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Ensure student belongs to the authenticated user's school
    if (student.schoolId !== ctx.school.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0)
    const balance = student.feeRequired - totalPaid

    logAudit({ userId: ctx.userId, schoolId: ctx.school.id, action: 'CERTIFICATE_GENERATED', details: `Student: ${student.name} (${student.admNo})`, ipAddress: getIp(req) }).catch(() => {})

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
        term: student.school.currentTerm
      }
    })
  } catch (err) {
    console.error('certificate error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
