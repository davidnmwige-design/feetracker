import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import ExcelJS from 'exceljs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { school: true }
  })

  if (!user?.school) {
    return NextResponse.json({ error: 'No school found' }, { status: 400 })
  }

  const students = await prisma.student.findMany({
    where: { schoolId: user.school.id },
    include: { payments: true },
    orderBy: { name: 'asc' }
  })

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Fee Report')

  sheet.columns = [
    { header: 'Adm No', key: 'admNo', width: 12 },
    { header: 'Student Name', key: 'name', width: 25 },
    { header: 'Class', key: 'class', width: 10 },
    { header: 'Stream', key: 'stream', width: 10 },
    { header: 'Parent Name', key: 'parentName', width: 20 },
    { header: 'Parent Phone', key: 'parentPhone', width: 15 },
    { header: 'Fee Required', key: 'feeRequired', width: 15 },
    { header: 'Total Paid', key: 'totalPaid', width: 15 },
    { header: 'Balance', key: 'balance', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
  ]

  // Style header row
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1F4E' } }
    cell.alignment = { horizontal: 'center' }
  })

  students.forEach(student => {
    const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0)
    const balance = student.feeRequired - totalPaid
    const status = balance <= 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid'

    const row = sheet.addRow({
      admNo: student.admNo,
      name: student.name,
      class: student.class,
      stream: student.stream || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      feeRequired: student.feeRequired,
      totalPaid,
      balance,
      status
    })

    const statusColor = status === 'Paid' ? 'FF00AA00' : status === 'Partial' ? 'FFCC8800' : 'FFCC0000'
    row.getCell('status').font = { color: { argb: statusColor }, bold: true }
  })

  // Summary row
  const totalExpected = students.reduce((sum, s) => sum + s.feeRequired, 0)
  const totalCollected = students.reduce((sum, s) => sum + s.payments.reduce((p, pay) => p + pay.amount, 0), 0)
  const totalBalance = totalExpected - totalCollected

  sheet.addRow({})
  const summaryRow = sheet.addRow({
    name: 'TOTALS',
    feeRequired: totalExpected,
    totalPaid: totalCollected,
    balance: totalBalance
  })
  summaryRow.eachCell(cell => {
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } }
  })

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="fee_report_' + user.school.term.replace(/ /g, '_') + '.xlsx"'
    }
  })
}