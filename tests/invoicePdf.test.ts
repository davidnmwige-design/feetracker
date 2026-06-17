import { describe, it, expect } from 'vitest'
import { renderInvoicePdf } from '../lib/invoicePdf'

const header = (pdf: Uint8Array) => Buffer.from(pdf.slice(0, 5)).toString('latin1')

describe('renderInvoicePdf (server-side)', () => {
  it('produces a valid PDF for a fully-specified invoice', () => {
    const pdf = renderInvoicePdf({
      school: { name: 'Stress Academy', currentTerm: 'Term 1 2026', paybill: '555001', accountNumberFormat: 'ADM' },
      student: {
        name: 'Jane Doe', admNo: 'ADM100', class: 'Grade 4', stream: 'A',
        parentName: 'Mary', parentPhone: '0712345678', parentEmail: 'mary@example.com',
        feeRequired: 20000, effectiveFee: 18000,
        tuitionFee: 15000, sportsFee: 3000, clubsFee: 1000, otherFee: 1000,
      },
      totalPaid: 5000,
      invoiceNumber: 1000,
    })
    expect(pdf.length).toBeGreaterThan(1000)
    expect(header(pdf)).toBe('%PDF-')
  })

  it('handles fee categories, a missing number (preview) and no paybill', () => {
    const pdf = renderInvoicePdf({
      school: { name: 'X School', currentTerm: 'Term 2 2026', paybill: null, accountNumberFormat: null },
      student: { name: 'A B', admNo: 'A/1', class: 'PP1', feeRequired: 1000 },
      totalPaid: 0,
      feeCategories: [{ name: 'Tuition', amount: 1000 }],
      invoiceNumber: null,
    })
    expect(header(pdf)).toBe('%PDF-')
  })
})
