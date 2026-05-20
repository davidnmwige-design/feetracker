import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { hasPermission, FORBIDDEN } from '@/lib/permissions'
import { resolveSchool } from '@/lib/schoolContext'
import { getEffectiveFee } from '@/lib/feeCalculations'
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
    if (!ctx) {
      return NextResponse.json({ error: 'No school found' }, { status: 400 })
    }

    if (!hasPermission(ctx.role, 'report', 'GET')) return NextResponse.json(FORBIDDEN, { status: 403 })

    const { searchParams } = new URL(req.url)
    const classFilter = searchParams.get('class')
    const where: Record<string, unknown> = { schoolId: ctx.school.id }
    if (classFilter) where['class'] = classFilter

    const students = await prisma.student.findMany({
      where,
      include: { payments: true, bursary: true, studentDiscounts: { include: { discount: true } } },
      orderBy: { name: 'asc' }
    })

    const rows = students.map(student => {
      const effectiveFee = getEffectiveFee(student.feeRequired, student.bursary, student.studentDiscounts)
      const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0)
      const balance = effectiveFee - totalPaid
      const status = balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid'
      return {
        'Adm No': student.admNo,
        'Student Name': student.name,
        'Class': student.class,
        'Stream': student.stream || '',
        'Parent Name': student.parentName || '',
        'Parent Phone': student.parentPhone || '',
        'Fee Required': effectiveFee,
        'Total Paid': totalPaid,
        'Balance': balance,
        'Status': status
      }
    })

    const totalExpected = students.reduce((sum, s) => sum + getEffectiveFee(s.feeRequired, s.bursary, s.studentDiscounts), 0)
    const totalCollected = students.reduce((sum, s) => sum + s.payments.reduce((p, pay) => p + pay.amount, 0), 0)

    rows.push({
      'Adm No': '',
      'Student Name': 'TOTALS',
      'Class': '',
      'Stream': '',
      'Parent Name': '',
      'Parent Phone': '',
      'Fee Required': totalExpected,
      'Total Paid': totalCollected,
      'Balance': totalExpected - totalCollected,
      'Status': ''
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fee Report')
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="fee_report.xlsx"'
      }
    })
  } catch (err) {
    console.error('report GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
