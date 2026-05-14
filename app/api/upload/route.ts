import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkRateLimit, getIp } from '@/lib/ratelimit'
import { sendEmail, paymentConfirmationHtml } from '@/lib/email'
import { decrypt } from '@/lib/encrypt'
import { logAudit } from '@/lib/audit'
import { getUserRole, hasPermission, FORBIDDEN } from '@/lib/permissions'
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

  if (!user?.school) {
    return NextResponse.json({ error: 'No school found' }, { status: 400 })
  }

  const role = await getUserRole(user.id, user.school)
  if (!hasPermission(role, 'upload', 'POST')) return NextResponse.json(FORBIDDEN, { status: 403 })

  const schoolId = user.school.id
  const formData = await req.formData()
  const file = formData.get('file') as File
  const bankType = String(formData.get('bankType') || 'mpesa')

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
        studentId: matched ? matched.id : null,
        schoolId,
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
      let msg = `Dear ${matched.parentName || 'Parent'}, we have received KES ${amount.toLocaleString()} for ${matched.name}, ${matched.class}. Outstanding balance: KES ${balance.toLocaleString()}. Thank you. - ${user.school!.name}`
      if (balance > 0 && user.school!.paybill) {
        const acctFmt = user.school!.accountNumberFormat ? ` Account ${user.school!.accountNumberFormat}` : ''
        msg += `\nIf you have an outstanding balance of KES ${balance.toLocaleString()}, please pay to Paybill ${user.school!.paybill}${acctFmt}`
      }
      const phone = matched.parentPhone
        ? '254' + matched.parentPhone.replace(/\s/g, '').replace(/^0/, '')
        : ''
      results.notifications.push({ msg, phone })

      if (matched.parentEmail) {
        const plainEmail = decrypt(matched.parentEmail)
        const hasFeeBreakdown = matched.tuitionFee > 0 || matched.sportsFee > 0 || matched.clubsFee > 0 || matched.otherFee > 0
        sendEmail({
          to: plainEmail,
          subject: `Payment received for ${matched.name} — ${user.school!.name}`,
          fromName: `${user.school!.name} via Elimu Pay`,
          replyTo: (user.school as any).replyToEmail || undefined,
          html: paymentConfirmationHtml({
            schoolName: user.school!.name,
            parentName: matched.parentName || 'Parent',
            studentName: matched.name,
            studentClass: `${matched.class} ${matched.stream || ''}`.trim(),
            amount,
            balance,
            breakdown: hasFeeBreakdown ? {
              tuitionFee: matched.tuitionFee,
              sportsFee: matched.sportsFee,
              clubsFee: matched.clubsFee,
              otherFee: matched.otherFee,
              totalFee: matched.feeRequired,
            } : undefined,
            paybill: user.school!.paybill,
            accountNumberFormat: user.school!.accountNumberFormat,
          }),
        }).catch(err => console.error('Payment email failed:', err))
      }
    } else {
      results.unmatched++
    }
  }

  await logAudit({ userId: user.id, schoolId, action: 'MPESA_UPLOAD', details: `${results.matched} matched, ${results.unmatched} unmatched of ${results.total} rows`, ipAddress: getIp(req) })
  return NextResponse.json(results)
  } catch (err) {
    console.error('upload error:', err)
    return NextResponse.json({ error: 'Something went wrong processing your file.' }, { status: 500 })
  }
}
