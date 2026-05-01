import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet) as any[]

  const students = await prisma.student.findMany()

  const results = {
    matched: 0,
    unmatched: 0,
    total: 0,
    notifications: [] as string[]
  }

  for (const row of rows) {
    const amount = Number(row['Amount'] || row['amount'] || row['Paid In'] || 0)
    const senderPhone = String(row['Phone'] || row['phone'] || row['MSISDN'] || '')
    const senderName = String(row['Name'] || row['name'] || row['Sender'] || '')
    const mpesaRef = String(row['Receipt No'] || row['mpesaRef'] || row['Transaction ID'] || '')

    if (amount <= 0) continue
    results.total++

    // Try to match by phone number
    const cleanPhone = senderPhone.replace(/\s/g, '').replace(/^254/, '0')
    const matched = students.find(s =>
      s.parentPhone &&
      s.parentPhone.replace(/\s/g, '').replace(/^254/, '0') === cleanPhone
    )

    const payment = await prisma.payment.create({
      data: {
        mpesaRef,
        amount,
        senderName,
        senderPhone,
        matched: !!matched,
        studentId: matched ? matched.id : null
      }
    })

    if (matched) {
      results.matched++
      const totalPaid = await prisma.payment.aggregate({
        where: { studentId: matched.id },
        _sum: { amount: true }
      })
      const paid = totalPaid._sum.amount || 0
      const balance = matched.feeRequired - paid
      const msg = `Dear ${matched.parentName || 'Parent'}, we have received KES ${amount.toLocaleString()} for ${matched.name}, ${matched.class}. Outstanding balance: KES ${balance.toLocaleString()}. Thank you. `
      results.notifications.push(msg)
    } else {
      results.unmatched++
    }
  }

  return NextResponse.json(results)
}