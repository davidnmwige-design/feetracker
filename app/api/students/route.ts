import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
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

    const students = await prisma.student.findMany({
      where: { schoolId: user.school.id },
      include: { payments: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(students)
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

    const planCap = currentCount <= 300 ? 300 : currentCount <= 600 ? 600 : 1000
    const planName = currentCount <= 300 ? 'Starter' : currentCount <= 600 ? 'Growth' : 'Premium'

    const formData = await req.formData()
    const file = formData.get('file') as File

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet) as any[]

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

      const student = await prisma.student.upsert({
        where: { admNo_schoolId: { admNo, schoolId } },
        update: { tuitionFee, sportsFee, clubsFee, otherFee, feeRequired },
        create: {
          name: String(row['Name'] || row['name'] || row['NAME'] || ''),
          admNo,
          class: String(row['Class'] || row['class'] || row['CLASS'] || ''),
          stream: String(row['Stream'] || row['stream'] || ''),
          parentName: String(row['Parent Name'] || row['parentName'] || ''),
          parentPhone: String(row['Parent Phone'] || row['parentPhone'] || ''),
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

    return NextResponse.json({ count: created.length })
  } catch (err) {
    console.error('students POST error:', err)
    return NextResponse.json({ error: 'Something went wrong processing your file.' }, { status: 500 })
  }
}
