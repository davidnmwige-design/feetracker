import { jsPDF } from 'jspdf'

// Server-side invoice PDF renderer. Single source of truth for the invoice layout —
// runs in a Route Handler (Node) so generation never blocks the browser main thread.
// Returns the PDF as a Uint8Array (stream it, or base64-encode it for an email attachment).

export interface InvoicePdfSchool {
  name: string
  currentTerm?: string | null
  paybill?: string | null
  accountNumberFormat?: string | null
}

export interface InvoicePdfStudent {
  name: string
  admNo?: string | null
  class: string
  stream?: string | null
  parentName?: string | null
  parentPhone?: string | null
  parentEmail?: string | null
  feeRequired: number
  effectiveFee?: number | null
  tuitionFee?: number
  sportsFee?: number
  clubsFee?: number
  otherFee?: number
}

export interface InvoicePdfInput {
  school: InvoicePdfSchool
  student: InvoicePdfStudent
  totalPaid: number
  feeCategories?: { name: string; amount: number }[]
  invoiceNumber?: number | null
}

export function renderInvoicePdf({ school, student, totalPaid, feeCategories, invoiceNumber }: InvoicePdfInput): Uint8Array {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const term = school.currentTerm || ''

  const today = new Date()
  const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const todayStr = today.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const dueDateStr = dueDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  // Use the school's stored sequential number once issued (tax-compliant); fall back to a
  // derived reference only for previews before the invoice has been saved.
  const invoiceNo = invoiceNumber != null
    ? `INV-${String(invoiceNumber).padStart(5, '0')}`
    : `INV-${today.getFullYear()}-${(student.admNo || 'STU').replace(/\//g, '-')}`
  const totalDue = Math.max(0, (student.effectiveFee ?? student.feeRequired) - totalPaid)

  // Navy header
  doc.setFillColor(10, 31, 78); doc.rect(0, 0, W, 42, 'F')
  doc.setFillColor(200, 168, 75); doc.rect(0, 42, W, 2.5, 'F')

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(200, 168, 75)
  doc.text(school.name.toUpperCase(), W / 2, 15, { align: 'center' })

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(170, 195, 225)
  doc.setCharSpace(2.5); doc.text('FEE INVOICE', W / 2, 25, { align: 'center' }); doc.setCharSpace(0)

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(200, 168, 75)
  doc.text(term, W / 2, 36, { align: 'center' })

  // Invoice meta
  let y = 54
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139)
  doc.text('Invoice No', 20, y); doc.text('Issue Date', 90, y); doc.text('Due Date', 155, y)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(10, 31, 78)
  doc.text(invoiceNo, 20, y + 6); doc.text(todayStr, 90, y + 6); doc.text(dueDateStr, 155, y + 6)
  doc.setDrawColor(220, 228, 240); doc.setLineWidth(0.3); doc.line(20, y + 12, W - 20, y + 12)

  // Student + Parent boxes
  y += 20
  doc.setFillColor(248, 249, 252); doc.setDrawColor(220, 228, 240); doc.setLineWidth(0.3)
  doc.rect(20, y, 80, 40, 'FD')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(100, 116, 139)
  doc.text('STUDENT', 25, y + 6)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(10, 31, 78)
  doc.text(student.name, 25, y + 13)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105)
  doc.text(`Adm No: ${student.admNo || '—'}`, 25, y + 20)
  const cls = `${student.class}${student.stream ? ' ' + student.stream : ''}`
  doc.text(`Class: ${cls}`, 25, y + 27)

  doc.setFillColor(248, 249, 252)
  doc.rect(W - 100, y, 80, 40, 'FD')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(100, 116, 139)
  doc.text('PARENT / GUARDIAN', W - 95, y + 6)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(10, 31, 78)
  doc.text(student.parentName || 'Parent', W - 95, y + 13)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105)
  if (student.parentPhone) doc.text(`Tel: ${student.parentPhone}`, W - 95, y + 20)
  if (student.parentEmail) doc.text(student.parentEmail.slice(0, 30), W - 95, y + 27)

  // Fee breakdown table
  y += 50
  doc.setFillColor(10, 31, 78); doc.rect(20, y, W - 40, 8, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(200, 168, 75)
  doc.text('DESCRIPTION', 25, y + 5.5)
  doc.text('AMOUNT', W - 25, y + 5.5, { align: 'right' })
  y += 8

  const feeRows: [string, number][] = []
  if (feeCategories && feeCategories.length > 0) {
    feeCategories.forEach(c => { if (c.amount > 0) feeRows.push([c.name, c.amount]) })
  } else {
    if ((student.tuitionFee ?? 0) > 0) feeRows.push(['Tuition Fee', student.tuitionFee!])
    if ((student.sportsFee ?? 0) > 0) feeRows.push(['Sports Fee', student.sportsFee!])
    if ((student.clubsFee ?? 0) > 0) feeRows.push(['Clubs Fee', student.clubsFee!])
    if ((student.otherFee ?? 0) > 0) feeRows.push(['Other Fee', student.otherFee!])
  }
  if (feeRows.length === 0) feeRows.push(['School Fees', student.feeRequired])

  feeRows.forEach(([desc, amt], i) => {
    const even = i % 2 === 0
    doc.setFillColor(even ? 255 : 248, even ? 255 : 249, even ? 255 : 252)
    doc.rect(20, y, W - 40, 9, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(71, 85, 105)
    doc.text(desc, 25, y + 6.5)
    doc.setTextColor(15, 23, 42)
    doc.text(`KES ${amt.toLocaleString()}`, W - 25, y + 6.5, { align: 'right' })
    y += 9
  })

  // Subtotal
  doc.setDrawColor(220, 228, 240); doc.setLineWidth(0.3); doc.line(20, y, W - 20, y)
  y += 7
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(71, 85, 105)
  doc.text('Subtotal', 25, y)
  doc.setTextColor(15, 23, 42)
  doc.text(`KES ${student.feeRequired.toLocaleString()}`, W - 25, y, { align: 'right' })
  y += 8

  doc.setTextColor(71, 85, 105); doc.text('Amount Paid', 25, y)
  doc.setTextColor(10, 124, 78)
  doc.text(`KES ${totalPaid.toLocaleString()}`, W - 25, y, { align: 'right' })
  y += 8

  // Total due row — gold background
  doc.setFillColor(200, 168, 75); doc.rect(20, y, W - 40, 12, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(10, 31, 78)
  doc.text('TOTAL DUE', 25, y + 8.5)
  doc.text(`KES ${totalDue.toLocaleString()}`, W - 25, y + 8.5, { align: 'right' })
  y += 20

  // HOW TO PAY box
  {
    const boxH = 38
    doc.setFillColor(10, 31, 78); doc.rect(20, y, W - 40, boxH, 'F')

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(200, 168, 75)
    doc.setCharSpace(2); doc.text('HOW TO PAY', 26, y + 9); doc.setCharSpace(0)

    if (school.paybill) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(148, 163, 200)
      doc.text('MPESA Paybill:', 26, y + 20)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(200, 168, 75)
      doc.text(school.paybill, 63, y + 20)

      const acctLine = school.accountNumberFormat
        ? `Account: ${school.accountNumberFormat}`
        : 'Account: Contact school'
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(148, 163, 200)
      doc.text(acctLine, 26, y + 30)

      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255, 255, 255)
      doc.text(`Amount: KES ${totalDue.toLocaleString()}`, W - 26, y + 30, { align: 'right' })
    } else {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(148, 163, 200)
      doc.text('Contact school for payment details', 26, y + 22)
    }
    y += boxH + 4
  }

  // Navy footer
  doc.setFillColor(10, 31, 78); doc.rect(0, 272, W, 25, 'F')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(170, 195, 225)
  doc.text(`For queries contact ${school.name}`, W / 2, 281, { align: 'center' })
  doc.setTextColor(200, 168, 75)
  doc.text('Powered by Elimu Pay', W / 2, 289, { align: 'center' })

  return new Uint8Array(doc.output('arraybuffer'))
}
