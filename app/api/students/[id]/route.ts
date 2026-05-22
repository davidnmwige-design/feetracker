import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { encrypt, decrypt } from '@/lib/encrypt'
import { parseBody, updateStudentSchema } from '@/lib/schemas'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import { resolveSchool } from '@/lib/schoolContext'
import { hashPhone } from '@/lib/phoneHash'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const studentId = Number(id)
    if (!studentId) return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 })

    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    if (!hasPermission(ctx.role, 'students', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: ctx.school.id },
      include: {
        payments: { orderBy: { paidAt: 'desc' } },
        school: true,
      }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    return NextResponse.json({
      ...student,
      parentEmail: student.parentEmail ? decrypt(student.parentEmail) : student.parentEmail,
      parent2Email: student.parent2Email ? decrypt(student.parent2Email) : student.parent2Email,
    })
  } catch (err) {
    console.error('students/[id] GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const studentId = Number(id)
    if (!studentId) return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 })

    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    if (!hasPermission(ctx.role, 'students', 'PATCH')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: ctx.school.id }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    let rawBody: unknown
    try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
    const parsed = parseBody(updateStudentSchema, rawBody)
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

    const d = parsed.data
    const data: Record<string, unknown> = {}
    if (d.name !== undefined) data.name = d.name
    if (d.admNo !== undefined) data.admNo = d.admNo
    if (d.studentClass !== undefined) data['class'] = d.studentClass
    if (d.stream !== undefined) data.stream = d.stream || null
    if (d.parentName !== undefined) data.parentName = d.parentName || null
    if (d.parentPhone !== undefined) {
      data.parentPhone = d.parentPhone || null
      data.parentPhoneHash = hashPhone(d.parentPhone || null)
    }
    if (d.parentEmail !== undefined) data.parentEmail = d.parentEmail ? encrypt(d.parentEmail) : null
    if (d.parent2Name !== undefined) data.parent2Name = d.parent2Name || null
    if (d.parent2Phone !== undefined) {
      data.parent2Phone = d.parent2Phone || null
      data.parent2PhoneHash = hashPhone(d.parent2Phone || null)
    }
    if (d.parent2Email !== undefined) data.parent2Email = d.parent2Email ? encrypt(d.parent2Email) : null

    const updated = await prisma.student.update({
      where: { id: studentId },
      data
    })
    return NextResponse.json({
      ...updated,
      parentEmail: updated.parentEmail ? decrypt(updated.parentEmail) : updated.parentEmail,
      parent2Email: updated.parent2Email ? decrypt(updated.parent2Email) : updated.parent2Email,
    })
  } catch (err) {
    console.error('students/[id] PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = await params
    const studentId = Number(id)
    if (!studentId) return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 })

    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    if (!hasPermission(ctx.role, 'students', 'DELETE')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: ctx.school.id },
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    await prisma.feeCategory.deleteMany({ where: { studentId } })
    await prisma.invoice.deleteMany({ where: { studentId } })
    await prisma.payment.updateMany({ where: { studentId }, data: { studentId: null, matched: false } })
    await prisma.student.delete({ where: { id: studentId } })

    logAudit({ userId: ctx.userId, schoolId: ctx.school.id, action: 'STUDENT_DELETED', details: `${student.name} (${student.admNo})`, ipAddress: getIp(req) }).catch(() => {})
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('students/[id] DELETE error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
