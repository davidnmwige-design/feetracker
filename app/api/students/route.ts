import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize } from '@/lib/sanitize'
import { encrypt, decrypt } from '@/lib/encrypt'
import { logAudit } from '@/lib/audit'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'
import * as XLSX from 'xlsx'

export async function GET(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    })

    if (!user?.school) return NextResponse.json([])

    const role = await getUserRole(user.id, user.school)
    if (!hasPermission(role, 'students', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const students = await prisma.student.findMany({
      where: { schoolId: user.school.id },
      include: { payments: true, feeCategories: true },
      orderBy: { name: 'asc' }
    })

    const decrypted = students.map(s => ({
      ...s,
      parentEmail: s.parentEmail ? decrypt(s.parentEmail) : s.parentEmail,
      parent2Email: s.parent2Email ? decrypt(s.parent2Email) : s.parent2Email,
    }))

    return NextResponse.json(decrypted)
  } catch (err) {
    console.error('students GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: { include: { _count: { select: { students: true } } } } }
    })

    if (!user?.school) {
      return NextResponse.json({ error: 'No school found' }, { status: 400 })
    }

    const schoolId = user.school.id
    const currentCount = (user.school as any)._count.students
    const planName = (user.school as any).currentPlan || 'Starter'
    const planCap = planName === 'Growth' ? 600 : planName === 'Premium' ? 1000 : planName === 'Enterprise' ? Infinity : 300

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file || !/\.(xlsx|xls|csv)$/i.test(file.name)) {
      return NextResponse.json({ error: 'Only .xlsx, .xls, and .csv files are accepted' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet) as any[]

    const rolePost = await getUserRole(user.id, user.school)
    if (!hasPermission(rolePost, 'students', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

    if (currentCount + rows.length > planCap) {
      return NextResponse.json({
        error: `Your ${planName} plan supports up to ${planCap} students. You currently have ${currentCount} students and this upload contains ${rows.length} rows, which would exceed your limit. Contact FeeTracker to upgrade your plan.`
      }, { status: 400 })
    }

    const created = []
    for (const row of rows) {
      const admNo = String(row['Adm No'] || row['admNo'] || row['ADM NO'] || '')
      const tuitionFee = Number(row['Tuition Fee'] || row['tuitionFee'] || row['Tuition'] || 0)
      const sportsFee = Number(row['Sports Fee'] || row['sportsFee'] || row['Sports'] || 0)
      const clubsFee = Number(row['Clubs Fee'] || row['clubsFee'] || row['Clubs'] || 0)
      const otherFee = Number(row['Other Fee'] || row['otherFee'] || row['Other'] || 0)
      const feeBreakdownTotal = tuitionFee + sportsFee + clubsFee + otherFee
      const feeRequired = feeBreakdownTotal > 0
        ? feeBreakdownTotal
        : Number(row['Fee Required'] || row['feeRequired'] || 0)

      const parentEmail = String(row['Parent Email'] || row['parentEmail'] || row['parent_email'] || '')
      const parent2Email = String(row['Parent 2 Email'] || row['parent2Email'] || '')
      const encryptedEmail = parentEmail ? encrypt(parentEmail) : null
      const encryptedEmail2 = parent2Email ? encrypt(parent2Email) : null
      const student = await prisma.student.upsert({
        where: { admNo_schoolId: { admNo, schoolId } },
        update: {
          tuitionFee, sportsFee, clubsFee, otherFee, feeRequired,
          ...(encryptedEmail ? { parentEmail: encryptedEmail } : {}),
          parent2Name: String(row['Parent 2 Name'] || row['parent2Name'] || '') || null,
          parent2Phone: String(row['Parent 2 Phone'] || row['parent2Phone'] || '') || null,
          ...(encryptedEmail2 ? { parent2Email: encryptedEmail2 } : {}),
        },
        create: {
          name: String(row['Name'] || row['name'] || row['NAME'] || ''),
          admNo,
          class: String(row['Class'] || row['class'] || row['CLASS'] || ''),
          stream: String(row['Stream'] || row['stream'] || ''),
          parentName: String(row['Parent Name'] || row['parentName'] || ''),
          parentPhone: String(row['Parent Phone'] || row['parentPhone'] || ''),
          parentEmail: encryptedEmail,
          parent2Name: String(row['Parent 2 Name'] || row['parent2Name'] || '') || null,
          parent2Phone: String(row['Parent 2 Phone'] || row['parent2Phone'] || '') || null,
          parent2Email: encryptedEmail2,
          feeRequired,
          tuitionFee,
          sportsFee,
          clubsFee,
          otherFee,
          schoolId
        }
      })
      created.push(student)
    }

    await logAudit({ userId: user.id, schoolId, action: 'STUDENT_IMPORT', details: `${created.length} students imported` })
    return NextResponse.json({ count: created.length })
  } catch (err) {
    console.error('students POST error:', err)
    return NextResponse.json({ error: 'Something went wrong processing your file.' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  if (!checkRateLimit(getIp(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { school: true }
    })
    if (!user?.school) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    const rolePatch = await getUserRole(user.id, user.school)
    if (!hasPermission(rolePatch, 'students', 'PATCH')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const body = await req.json()
    const studentId = Number(body.studentId)
    const rawEmail = sanitize(body.parentEmail || '', 200).toLowerCase() || null
    const parentEmail = rawEmail ? encrypt(rawEmail) : null

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: user.school.id }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { parentEmail }
    })
    return NextResponse.json({ ...updated, parentEmail: rawEmail })
  } catch (err) {
    console.error('students PATCH error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
