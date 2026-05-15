import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { encrypt, decrypt } from '@/lib/encrypt'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await resolveSchool(session.user.email)
  if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

  if (!hasPermission(ctx.role, 'students', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const body = await req.json()
  const {
    name, admNo, studentClass, stream,
    parentName, parentPhone, parentEmail,
    parent2Name, parent2Phone, parent2Email,
    categories = [],
  } = body

  if (!name?.trim() || !admNo?.trim() || !studentClass?.trim()) {
    return NextResponse.json({ error: 'Name, admission number, and class are required' }, { status: 400 })
  }

  const cleanAdmNo = sanitize(admNo, 50).trim()
  const existing = await prisma.student.findFirst({ where: { admNo: cleanAdmNo, schoolId: ctx.school.id } })
  if (existing) return NextResponse.json({ error: `Admission number ${cleanAdmNo} is already in use` }, { status: 400 })

  const validCats = (categories as { name: string; amount: number }[]).filter(c => c.name?.trim() && Number(c.amount) >= 0)
  const feeRequired = validCats.reduce((sum, c) => sum + (Number(c.amount) || 0), 0)

  const encEmail = parentEmail?.trim() ? encrypt(sanitize(parentEmail.trim().toLowerCase(), 200)) : null
  const encEmail2 = parent2Email?.trim() ? encrypt(sanitize(parent2Email.trim().toLowerCase(), 200)) : null

  const student = await prisma.student.create({
    data: {
      name: sanitize(name.trim(), 200),
      admNo: cleanAdmNo,
      class: sanitize(studentClass.trim(), 50),
      stream: stream?.trim() ? sanitize(stream.trim(), 50) : null,
      parentName: parentName?.trim() ? sanitize(parentName.trim(), 200) : null,
      parentPhone: parentPhone?.trim() ? sanitize(parentPhone.trim(), 50) : null,
      parentEmail: encEmail,
      parent2Name: parent2Name?.trim() ? sanitize(parent2Name.trim(), 200) : null,
      parent2Phone: parent2Phone?.trim() ? sanitize(parent2Phone.trim(), 50) : null,
      parent2Email: encEmail2,
      feeRequired,
      schoolId: ctx.school.id,
      ...(validCats.length > 0 ? {
        feeCategories: {
          create: validCats.map(c => ({ name: sanitize(String(c.name), 100), amount: Number(c.amount) }))
        }
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
