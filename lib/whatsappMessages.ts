import { normalizePhoneForWhatsApp } from '@/lib/phoneUtils'

interface ReceiptData {
  parentName: string
  studentName: string
  studentClass: string
  amount: number
  balance: number
  schoolName: string
  paybill?: string | null
  accountNumberFormat?: string | null
  term?: string
}

interface InvoiceData {
  parentName: string
  studentName: string
  studentClass: string
  feeCategories?: { name: string; amount: number }[]
  tuitionFee?: number
  sportsFee?: number
  clubsFee?: number
  otherFee?: number
  totalPaid: number
  totalDue: number
  schoolName: string
  paybill?: string | null
  accountNumberFormat?: string | null
  term: string
}

export function buildReceiptMessage(data: ReceiptData): string {
  const lines: string[] = []
  lines.push(`Dear ${data.parentName},`)
  lines.push(``)
  lines.push(`We have received a payment for *${data.studentName}* (${data.studentClass}).`)
  lines.push(``)
  lines.push(`*Amount Paid:* KES ${data.amount.toLocaleString()}`)

  if (data.balance <= 0) {
    lines.push(`*Balance:* KES 0 — FULLY CLEARED ✅`)
  } else {
    lines.push(`*Outstanding Balance:* KES ${data.balance.toLocaleString()}`)
    if (data.paybill) {
      lines.push(``)
      lines.push(`*To pay balance:*`)
      lines.push(`MPESA Paybill: *${data.paybill}*`)
      if (data.accountNumberFormat) lines.push(`Account: ${data.accountNumberFormat}`)
      lines.push(`Amount: KES ${data.balance.toLocaleString()}`)
    }
  }

  if (data.term) {
    lines.push(``)
    lines.push(`Term: ${data.term}`)
  }
  lines.push(``)
  lines.push(`— ${data.schoolName}`)

  return lines.join('\n')
}

export function buildInvoiceMessage(data: InvoiceData): string {
  const lines: string[] = []
  lines.push(`Dear ${data.parentName},`)
  lines.push(``)
  lines.push(`Here is the fee invoice for *${data.studentName}* (${data.studentClass}) for *${data.term}*:`)
  lines.push(``)

  if (data.feeCategories && data.feeCategories.length > 0) {
    data.feeCategories.forEach(c => {
      if (c.amount > 0) lines.push(`- ${c.name}: KES ${c.amount.toLocaleString()}`)
    })
  } else {
    if ((data.tuitionFee ?? 0) > 0) lines.push(`- Tuition: KES ${data.tuitionFee!.toLocaleString()}`)
    if ((data.sportsFee ?? 0) > 0) lines.push(`- Sports: KES ${data.sportsFee!.toLocaleString()}`)
    if ((data.clubsFee ?? 0) > 0) lines.push(`- Clubs: KES ${data.clubsFee!.toLocaleString()}`)
    if ((data.otherFee ?? 0) > 0) lines.push(`- Other: KES ${data.otherFee!.toLocaleString()}`)
  }

  lines.push(`- Amount paid: KES ${data.totalPaid.toLocaleString()}`)
  lines.push(`- *TOTAL DUE: KES ${data.totalDue.toLocaleString()}*`)

  if (data.paybill && data.totalDue > 0) {
    const acct = data.accountNumberFormat ? ` | Account: ${data.accountNumberFormat}` : ''
    lines.push(``)
    lines.push(`*HOW TO PAY:* MPESA Paybill ${data.paybill}${acct} | Amount: KES ${data.totalDue.toLocaleString()}`)
  }

  lines.push(``)
  lines.push(`— ${data.schoolName}`)

  return lines.join('\n')
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizePhoneForWhatsApp(phone)
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export function buildReceiptWhatsAppUrl(phone: string, data: ReceiptData): string {
  return buildWhatsAppUrl(phone, buildReceiptMessage(data))
}

export function buildInvoiceWhatsAppUrl(phone: string, data: InvoiceData): string {
  return buildWhatsAppUrl(phone, buildInvoiceMessage(data))
}
