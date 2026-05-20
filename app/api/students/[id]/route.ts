import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { encrypt, decrypt } from '@/lib/encrypt'
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

    const body = await req.json()
    const data: Record<string, string | null> = {}

    if ('name' in body) {
      const nameVal = sanitize(body.name || '', 200).trim()
      if (!nameVal) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      data.name = nameVal
    }
    if ('admNo' in body) {
      const admNoVal = sanitize(body.admNo || '', 100).trim()
      if (!admNoVal) return NextResponse.json({ error: 'Admission number is required' }, { status: 400 })
      data.admNo = admNoVal
    }
    if ('class' in body) {
      data['class'] = sanitize(body['class'] || '', 100).trim() || null
    }
    if ('stream' in body) {
      data.stream = sanitize(body.stream || '', 100).trim() || null
    }
    if ('parentName' in body) {
      data.parentName = sanitize(body.parentName || '', 200).trim() || null
    }
    if ('parentPhone' in body) {
      const phoneVal = sanitize(body.parentPhone || '', 50).trim() || null
      data.parentPhone = phoneVal
      ;(data as Record<string, unknown>).parentPhoneHash = hashPhone(phoneVal)
    }
    if ('parentEmail' in body) {
      const raw = sanitize(body.parentEmail || '', 200).toLowerCase().trim() || null
      data.parentEmail = raw ? encrypt(raw) : null
    }
    if ('parent2Name' in body) {
      data.parent2Name = sanitize(body.parent2Name || '', 200).trim() || null
    }
    if ('parent2Phone' in body) {
      const phone2Val = sanitize(body.parent2Phone || '', 50).trim() || null
      data.parent2Phone = phone2Val
      ;(data as Record<string, unknown>).parent2PhoneHash = hashPhone(phone2Val)
    }
    if ('parent2Email' in body) {
      const raw2 = sanitize(body.parent2Email || '', 200).toLowerCase().trim() || null
      data.parent2Email = raw2 ? encrypt(raw2) : null
    }

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
