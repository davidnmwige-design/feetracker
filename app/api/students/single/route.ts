import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { encrypt, decrypt } from '@/lib/encrypt'
import { parseBody, createStudentSchema } from '@/lib/schemas'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

  if (!hasPermission(ctx.role, 'students', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  let rawBody: unknown
  try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 }) }
  const parsed = parseBody(createStudentSchema, rawBody)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { name, admNo, studentClass, parentName, parentPhone, parentEmail, parent2Name, parent2Phone, parent2Email, stream, categories = [] } = parsed.data

  const existing = await prisma.student.findFirst({ where: { admNo, schoolId: ctx.school.id } })
  if (existing) return NextResponse.json({ error: `Admission number ${admNo} is already in use` }, { status: 400 })

  const validCats = categories.filter(c => c.name && c.amount >= 0)
  const feeRequired = validCats.reduce((sum, c) => sum + c.amount, 0)

  const encEmail = parentEmail ? encrypt(parentEmail) : null
  const encEmail2 = parent2Email ? encrypt(parent2Email) : null

  const student = await prisma.student.create({
    data: {
      name,
      admNo,
      class: studentClass,
      stream: stream || null,
      parentName: parentName || null,
      parentPhone: parentPhone || null,
      parentEmail: encEmail,
      parent2Name: parent2Name || null,
      parent2Phone: parent2Phone || null,
      parent2Email: encEmail2,
      feeRequired,
      schoolId: ctx.school.id,
      ...(validCats.length > 0 ? {
        feeCategories: { create: validCats.map(c => ({ name: c.name, amount: c.amount })) }
      } : {}),
    },
    include: { payments: true, feeCategories: true },
  })

  return NextResponse.json({
    ...student,
    parentEmail: student.parentEmail ? decrypt(student.parentEmail) : null,
    parent2Email: student.parent2Email ? decrypt(student.parent2Email) : null,
  })
}
