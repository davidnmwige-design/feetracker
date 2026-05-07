import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { decrypt } from '@/lib/encrypt'
import { logAudit } from '@/lib/audit'
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
      include: { school: true },
    })
    if (!user?.school) return NextResponse.json({ error: 'No school found' }, { status: 400 })

    const schoolId = user.school.id

    const [students, payments, invoices] = await Promise.all([
      prisma.student.findMany({ where: { schoolId }, orderBy: { name: 'asc' } }),
      prisma.payment.findMany({ where: { schoolId }, orderBy: { paidAt: 'desc' } }),
      prisma.invoice.findMany({ where: { schoolId }, orderBy: { sentAt: 'desc' } }),
    ])

    const studentRows = students.map(s => ({
      Name: s.name,
      'Adm No': s.admNo,
      Class: s.class,
      Stream: s.stream || '',
      'Parent Name': s.parentName || '',
      'Parent Phone': s.parentPhone || '',
      'Parent Email': s.parentEmail ? decrypt(s.parentEmail) : '',
      'Fee Required': s.feeRequired,
      'Tuition Fee': s.tuitionFee,
      'Sports Fee': s.sportsFee,
      'Clubs Fee': s.clubsFee,
      'Other Fee': s.otherFee,
    }))

    const paymentRows = payments.map(p => ({
      'M-Pesa Ref': p.mpesaRef || '',
      Amount: p.amount,
      'Sender Name': p.senderName || '',
      'Sender Phone': p.senderPhone || '',
      Matched: p.matched ? 'Yes' : 'No',
      'Student ID': p.studentId || '',
      Date: p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-KE') : '',
    }))

    const invoiceRows = invoices.map(inv => ({
      'Student ID': inv.studentId,
      Term: inv.term,
      Status: inv.status,
      Amount: inv.amount,
      'Sent At': inv.sentAt ? new Date(inv.sentAt).toLocaleDateString('en-KE') : '',
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentRows), 'Students')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), 'Payments')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoiceRows), 'Invoices')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    logAudit({ userId: user.id, schoolId, action: 'DATA_EXPORT', details: `${students.length} students, ${payments.length} payments, ${invoices.length} invoices`, ipAddress: getIp(req) }).catch(() => {})

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="feetracker-export-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('export error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
