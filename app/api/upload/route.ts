import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import * as XLSX from 'xlsx'

function parseRow(row: any, bankType: string): {
  amount: number
  senderPhone: string
  senderName: string
  mpesaRef: string
} {
  switch (bankType) {
    case 'equity':
      return {
        amount: Number(row['Credit'] || row['CR Amount'] || row['Cr Amount'] || row['credit'] || 0),
        senderPhone: '',
        senderName: String(row['Description'] || row['Narration'] || row['description'] || ''),
        mpesaRef: String(row['Reference'] || row['Ref No'] || row['reference'] || row['Transaction ID'] || ''),
      }
    case 'kcb':
      return {
        amount: Number(row['Credit'] || row['CR'] || row['credit'] || 0),
        senderPhone: '',
        senderName: String(row['Description'] || row['Narration'] || row['description'] || ''),
        mpesaRef: String(row['Reference No'] || row['Ref'] || row['Transaction Ref'] || row['reference'] || ''),
      }
    case 'coop':
      return {
        amount: Number(row['Credit'] || row['CR'] || row['credit'] || row['Amount'] || 0),
        senderPhone: '',
        senderName: String(row['Particulars'] || row['Description'] || row['particulars'] || ''),
        mpesaRef: String(row['Reference'] || row['Cheque No'] || row['reference'] || ''),
      }
    case 'ncba':
      return {
        amount: Number(row['Credit'] || row['CR Amount'] || row['credit'] || 0),
        senderPhone: '',
        senderName: String(row['Narration'] || row['Description'] || row['narration'] || ''),
        mpesaRef: String(row['Transaction Reference'] || row['Ref No'] || row['reference'] || ''),
      }
    case 'mpesa':
      return {
        amount: Number(row['Amount'] || row['amount'] || row['Paid In'] || row['Credit'] || 0),
        senderPhone: String(row['Phone'] || row['phone'] || row['MSISDN'] || ''),
        senderName: String(row['Name'] || row['name'] || row['Sender'] || ''),
        mpesaRef: String(row['Receipt No'] || row['mpesaRef'] || row['Transaction ID'] || row['Reference'] || ''),
      }
    default:
      // Generic fallback for all other Kenyan banks
      return {
        amount: Number(row['Credit'] || row['CR Amount'] || row['Cr Amount'] || row['Amount'] || row['credit'] || row['amount'] || 0),
        senderPhone: '',
        senderName: String(row['Description'] || row['Narration'] || row['Particulars'] || row['Sender'] || row['description'] || ''),
        mpesaRef: String(row['Reference'] || row['Ref No'] || row['Transaction ID'] || row['Transaction Reference'] || row['Cheque No'] || row['reference'] || ''),
      }
  }
}

export async function POST(req: Request) {
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

  const schoolId = user.school.id
  const formData = await req.formData()
  const file = formData.get('file') as File
  const bankType = String(formData.get('bankType') || 'mpesa')

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet) as any[]

  const students = await prisma.student.findMany({ where: { schoolId } })

  const results = {
    matched: 0,
    unmatched: 0,
    total: 0,
    notifications: [] as { msg: string; phone: string }[]
  }

  for (const row of rows) {
    const { amount, senderPhone, senderName, mpesaRef } = parseRow(row, bankType)

    if (amount <= 0) continue
    results.total++

    if (mpesaRef) {
      const existing = await prisma.payment.findFirst({ where: { mpesaRef } })
      if (existing) continue
    }

    const cleanPhone = senderPhone.replace(/\s/g, '').replace(/^254/, '0')
    const matched = students.find(s =>
      s.parentPhone &&
      s.parentPhone.replace(/\s/g, '').replace(/^254/, '0') === cleanPhone
    )

    await prisma.payment.create({
      data: {
        mpesaRef: mpesaRef || null,
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
      const msg = `Dear ${matched.parentName || 'Parent'}, we have received KES ${amount.toLocaleString()} for ${matched.name}, ${matched.class}. Outstanding balance: KES ${balance.toLocaleString()}. Thank you. - ${user.school!.name}`
      const phone = matched.parentPhone
        ? '254' + matched.parentPhone.replace(/\s/g, '').replace(/^0/, '')
        : ''
      results.notifications.push({ msg, phone })
    } else {
      results.unmatched++
    }
  }

  return NextResponse.json(results)
}
