import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import * as ExcelJS from 'exceljs'

async function requireAdmin(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  return user?.isAdmin ? user : null
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const schools = await prisma.school.findMany({
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { students: true, payments: true } },
      }
    })

    const wb = new ExcelJS.Workbook()

    // Schools sheet
    const ws = wb.addWorksheet('Schools')
    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'School Name', key: 'name', width: 30 },
      { header: 'Admin Name', key: 'adminName', width: 20 },
      { header: 'Admin Email', key: 'adminEmail', width: 30 },
      { header: 'Plan', key: 'plan', width: 12 },
      { header: 'Students', key: 'students', width: 12 },
      { header: 'Payments', key: 'payments', width: 12 },
      { header: 'Paybill', key: 'paybill', width: 14 },
      { header: 'Current Term', key: 'term', width: 16 },
      { header: 'Trial Ends', key: 'trialEnds', width: 16 },
      { header: 'Joined', key: 'joined', width: 16 },
    ]
    schools.forEach(s => ws.addRow({
      id: s.id,
      name: s.name,
      adminName: s.user?.name,
      adminEmail: s.user?.email,
      plan: s.currentPlan,
      students: s._count.students,
      payments: s._count.payments,
      paybill: s.paybill || '',
      term: s.currentTerm,
      trialEnds: s.trialEndsAt ? new Date(s.trialEndsAt).toLocaleDateString('en-KE') : '',
      joined: new Date(s.createdAt).toLocaleDateString('en-KE'),
    }))

    const buffer = await wb.xlsx.writeBuffer()
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="feetracker-platform-export-${new Date().toISOString().slice(0,10)}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('export-all error:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
