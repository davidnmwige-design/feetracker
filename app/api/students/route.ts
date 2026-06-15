import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sanitize, sanitizeName } from '@/lib/sanitize'
import { encrypt, decrypt } from '@/lib/encrypt'
import { logAudit } from '@/lib/audit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { getEffectiveFee } from '@/lib/feeCalculations'
import { hashPhone } from '@/lib/phoneHash'
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
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json([])

    if (!hasPermission(ctx.role, 'students', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const url = new URL(req.url)
    const cursor = url.searchParams.get('cursor')
    const paginate = url.searchParams.get('paginate') === 'true'
    const PAGE_SIZE = 50

    const baseQuery = {
      where: { schoolId: ctx.school.id },
      include: { payments: true, feeCategories: true, bursary: true, studentDiscounts: { include: { discount: true } } },
      orderBy: [{ name: 'asc' as const }, { id: 'asc' as const }],
    }

    if (paginate) {
      const [students, total] = await Promise.all([
        prisma.student.findMany({
          ...baseQuery,
          take: PAGE_SIZE + 1,
          ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
        }),
        prisma.student.count({ where: { schoolId: ctx.school.id } }),
      ])

      const hasMore = students.length > PAGE_SIZE
      const page = hasMore ? students.slice(0, PAGE_SIZE) : students
      const nextCursor = hasMore ? page[page.length - 1].id : null

      const decrypted = page.map(s => ({
        ...s,
        parentEmail: s.parentEmail ? decrypt(s.parentEmail) : s.parentEmail,
        parent2Email: s.parent2Email ? decrypt(s.parent2Email) : s.parent2Email,
        effectiveFee: getEffectiveFee(s.feeRequired, s.bursary, s.studentDiscounts),
      }))

      return NextResponse.json({ students: decrypted, nextCursor, hasMore, total })
    }

    const students = await prisma.student.findMany({ ...baseQuery })

    const decrypted = students.map(s => ({
      ...s,
      parentEmail: s.parentEmail ? decrypt(s.parentEmail) : s.parentEmail,
      parent2Email: s.parent2Email ? decrypt(s.parent2Email) : s.parent2Email,
      effectiveFee: getEffectiveFee(s.feeRequired, s.bursary, s.studentDiscounts),
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
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) {
      return NextResponse.json({ error: 'No school found' }, { status: 400 })
    }

    if (!hasPermission(ctx.role, 'students', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const schoolId = ctx.school.id
    const [schoolWithCount, userRecord] = await Promise.all([
      prisma.school.findUnique({
        where: { id: schoolId },
        select: { trialEndsAt: true, _count: { select: { students: true } } },
      }),
      prisma.user.findUnique({ where: { email: session.user.email }, select: { isAdmin: true } }),
    ])
    const currentCount = schoolWithCount?._count?.students ?? 0
    const TRIAL_LIMIT = 50
    const isOnTrial = !!schoolWithCount?.trialEndsAt

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file || !/\.(xlsx|xls|csv)$/i.test(file.name)) {
      return NextResponse.json({ error: 'Only .xlsx, .xls, and .csv files are accepted' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()

    // NOTE: xlsx has known CVEs. File size is limited to 10MB and content is
    // validated before processing. cellFormula/cellHTML disabled to reduce attack surface.
    let workbook: ReturnType<typeof XLSX.read>
    try {
      workbook = await Promise.race([
        Promise.resolve().then(() => XLSX.read(buffer, { type: 'array', cellFormula: false, cellHTML: false })),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('parse_timeout')), 10_000)),
      ])
    } catch (err) {
      if (err instanceof Error && err.message === 'parse_timeout') {
        return NextResponse.json({ error: 'File parsing timed out. Please try a smaller file.' }, { status: 408 })
      }
      return NextResponse.json({ error: 'Could not read file. Please check the format and try again.' }, { status: 400 })
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet) as any[]

    if (!userRecord?.isAdmin && isOnTrial && currentCount + rows.length > TRIAL_LIMIT) {
      return NextResponse.json({
        error: 'trial_limit_reached',
        message: `Your free trial supports up to ${TRIAL_LIMIT} students. You currently have ${currentCount} students and this file contains ${rows.length} rows, which would exceed your trial limit. Contact us at support@elimupay.co.ke or WhatsApp +254 746 353 411 to activate your paid account.`,
        currentCount,
        trialLimit: TRIAL_LIMIT,
      }, { status: 403 })
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
      const rawPhone = String(row['Parent Phone'] || row['parentPhone'] || '')
      const rawPhone2 = String(row['Parent 2 Phone'] || row['parent2Phone'] || '') || null
      const student = await prisma.student.upsert({
        where: { admNo_schoolId: { admNo, schoolId } },
        update: {
          tuitionFee, sportsFee, clubsFee, otherFee, feeRequired,
          ...(encryptedEmail ? { parentEmail: encryptedEmail } : {}),
          parent2Name: sanitizeName(String(row['Parent 2 Name'] || row['parent2Name'] || '')) || null,
          parent2Phone: rawPhone2,
          parent2PhoneHash: hashPhone(rawPhone2),
          ...(encryptedEmail2 ? { parent2Email: encryptedEmail2 } : {}),
        },
        create: {
          name: sanitizeName(String(row['Name'] || row['name'] || row['NAME'] || '')),
          admNo,
          class: sanitizeName(String(row['Class'] || row['class'] || row['CLASS'] || '')),
          stream: sanitizeName(String(row['Stream'] || row['stream'] || '')),
          parentName: sanitizeName(String(row['Parent Name'] || row['parentName'] || '')),
          parentPhone: rawPhone,
          parentPhoneHash: hashPhone(rawPhone),
          parentEmail: encryptedEmail,
          parent2Name: sanitizeName(String(row['Parent 2 Name'] || row['parent2Name'] || '')) || null,
          parent2Phone: rawPhone2,
          parent2PhoneHash: hashPhone(rawPhone2),
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

    await logAudit({ userId: ctx.userId, schoolId, action: 'STUDENT_IMPORT', details: `${created.length} students imported` })
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
    const ctx = await resolveSchool(session.user.email)
    if (!ctx) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    if (!hasPermission(ctx.role, 'students', 'PATCH')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const body = await req.json()
    const studentId = Number(body.studentId)
    const rawEmail = sanitize(body.parentEmail || '', 200).toLowerCase() || null
    const parentEmail = rawEmail ? encrypt(rawEmail) : null

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId: ctx.school.id }
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
