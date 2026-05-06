'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const TERMS = [
  'Term 1 2026', 'Term 2 2026', 'Term 3 2026',
  'Term 1 2027', 'Term 2 2027', 'Term 3 2027',
]

function getPlanDetails(studentCount: number) {
  if (studentCount <= 300) return { name: 'Starter', maxStudents: 300, monthly: 4500, setup: 15000 }
  if (studentCount <= 600) return { name: 'Growth', maxStudents: 600, monthly: 6500, setup: 20000 }
  return { name: 'Premium', maxStudents: 1000, monthly: 9000, setup: 25000 }
}

export default function Settings() {
  const [terms, setTerms] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [studentCount, setStudentCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [schoolRes, termsRes, studentsRes] = await Promise.all([
      fetch('/api/school'),
      fetch('/api/terms'),
      fetch('/api/students')
    ])
    const schoolData = await schoolRes.json()
    const termsData = await termsRes.json()
    const studentsData = await studentsRes.json()
    setSchool(schoolData)
    setTerms(termsData)
    setStudentCount(Array.isArray(studentsData) ? studentsData.length : 0)
    setLoading(false)
  }

  async function startNewTerm() {
    if (!selectedTerm) return
    setStarting(true)
    await fetch('/api/terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termName: selectedTerm })
    })
    await fetchData()
    setSelectedTerm('')
    setStarting(false)
  }

  async function downloadInvoice() {
    if (!school) return
    const { jsPDF } = await import('jspdf')
    const plan = getPlanDetails(studentCount)
    const today = new Date()
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const invoiceNum = 'FT-' + school.id + '-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0')
    const isFirstInvoice = terms.length <= 1

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const w = 210

    // Header bar
    doc.setFillColor(10, 31, 78)
    doc.rect(0, 0, w, 40, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(200, 168, 75)
    doc.text('FeeTracker', 20, 18)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(180, 190, 210)
    doc.text('Fee management platform for Kenyan schools', 20, 26)
    doc.text('support@feetracker.co.ke', 20, 32)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text('INVOICE', w - 20, 22, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(180, 190, 210)
    doc.text(invoiceNum, w - 20, 30, { align: 'right' })

    // Invoice metadata
    const metaY = 54
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Invoice date', 20, metaY)
    doc.text('Due date', 80, metaY)
    doc.text('Plan', 140, metaY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text(today.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }), 20, metaY + 6)
    doc.text(dueDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }), 80, metaY + 6)
    doc.text(plan.name, 140, metaY + 6)

    // Divider
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(20, metaY + 14, w - 20, metaY + 14)

    // Bill to
    const billY = metaY + 22
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('BILL TO', 20, billY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(school.name, 20, billY + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Current term: ' + school.currentTerm, 20, billY + 14)
    doc.text('Students enrolled: ' + studentCount, 20, billY + 20)

    // Line items table
    const tableY = billY + 34
    doc.setFillColor(248, 249, 252)
    doc.rect(20, tableY, w - 40, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('DESCRIPTION', 24, tableY + 5.5)
    doc.text('AMOUNT', w - 24, tableY + 5.5, { align: 'right' })

    const items: [string, number][] = [
      [plan.name + ' Plan — monthly subscription (' + plan.maxStudents + ' students max)', plan.monthly],
    ]
    if (isFirstInvoice) {
      items.push(['One-time platform setup fee', plan.setup])
    }

    let itemY = tableY + 16
    items.forEach(([desc, amount], i) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(15, 23, 42)
      doc.text(desc, 24, itemY)
      doc.setFont('helvetica', 'bold')
      doc.text('KES ' + amount.toLocaleString(), w - 24, itemY, { align: 'right' })
      if (i < items.length - 1) {
        doc.setDrawColor(241, 245, 249)
        doc.setLineWidth(0.2)
        doc.line(20, itemY + 5, w - 20, itemY + 5)
      }
      itemY += 14
    })

    // Total
    const total = items.reduce((s, [, a]) => s + a, 0)
    doc.setFillColor(10, 31, 78)
    doc.rect(20, itemY, w - 40, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(200, 168, 75)
    doc.text('TOTAL DUE', 24, itemY + 8)
    doc.setTextColor(255, 255, 255)
    doc.text('KES ' + total.toLocaleString(), w - 24, itemY + 8, { align: 'right' })

    // Payment instructions
    const instrY = itemY + 24
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(10, 31, 78)
    doc.text('Payment Instructions', 20, instrY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text('Pay via M-Pesa Paybill:', 20, instrY + 8)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text('Paybill: 400200 | Account: ' + invoiceNum, 20, instrY + 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Payment due by: ' + dueDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }), 20, instrY + 24)
    doc.text('Questions? Email support@feetracker.co.ke or WhatsApp +254 700 000 000', 20, instrY + 32)

    // Footer
    doc.setFillColor(10, 31, 78)
    doc.rect(0, 275, w, 22, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text('FeeTracker · Nairobi, Kenya · support@feetracker.co.ke', w / 2, 284, { align: 'center' })
    doc.text('Thank you for choosing FeeTracker to manage your school fees.', w / 2, 290, { align: 'center' })

    doc.save('FeeTracker_Invoice_' + invoiceNum + '.pdf')
    return { invoiceNum, plan, total, isFirstInvoice, today, dueDate }
  }

  function sendInvoiceWhatsApp() {
    if (!school) return
    const plan = getPlanDetails(studentCount)
    const today = new Date()
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    const invoiceNum = 'FT-' + school.id + '-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, '0')
    const isFirstInvoice = terms.length <= 1
    const total = plan.monthly + (isFirstInvoice ? plan.setup : 0)

    const msg = `*FeeTracker Invoice*\n\nInvoice: ${invoiceNum}\nDate: ${today.toLocaleDateString('en-KE')}\nDue: ${dueDate.toLocaleDateString('en-KE')}\n\nBill to: ${school.name}\nPlan: ${plan.name} (up to ${plan.maxStudents} students)\n\n*Breakdown:*\n• ${plan.name} monthly subscription: KES ${plan.monthly.toLocaleString()}${isFirstInvoice ? `\n• One-time setup fee: KES ${plan.setup.toLocaleString()}` : ''}\n\n*Total due: KES ${total.toLocaleString()}*\n\n*Pay via M-Pesa:*\nPaybill: 400200\nAccount: ${invoiceNum}\n\nQuestions? Reply to this message or email support@feetracker.co.ke`
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank')
  }

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif'}}>
      <style>{`
        @media (max-width: 640px) {
          .set-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .set-content { padding: 16px !important; max-width: 100% !important; }
          .set-term-row { flex-direction: column !important; }
          .set-invoice-row { flex-direction: column !important; }
        }
      `}</style>

      <div className="set-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px'}}>Settings</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>{school?.name || 'School settings'}</p>
        </div>
        <Link href="/dashboard" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
          ← Dashboard
        </Link>
      </div>

      <div className="set-content" style={{padding: '24px 32px', maxWidth: '640px'}}>
        {loading ? (
          <div style={{textAlign: 'center', color: '#94a3b8', padding: '48px'}}>Loading...</div>
        ) : (
          <>
            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>School details</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>Your school information</p>
              {[
                {label: 'School name', value: school?.name},
                {label: 'MPESA Paybill', value: school?.paybill || '—'},
                {label: 'Current term', value: school?.currentTerm},
                {label: 'Plan', value: getPlanDetails(studentCount).name + ' (' + studentCount + ' / ' + getPlanDetails(studentCount).maxStudents + ' students)'},
              ].map((row, i, arr) => (
                <div key={row.label} style={{display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none'}}>
                  <span style={{fontSize: '13px', color: '#64748b'}}>{row.label}</span>
                  <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Start a new term</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                This will archive the current term and start fresh. All students stay in the system but payments reset for the new term.
              </p>
              <div className="set-term-row" style={{display: 'flex', gap: '10px'}}>
                <select
                  style={{flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: '#0f172a', background: '#fff', outline: 'none'}}
                  value={selectedTerm}
                  onChange={e => setSelectedTerm(e.target.value)}
                >
                  <option value="">Select new term...</option>
                  {TERMS.filter(t => t !== school?.currentTerm).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={startNewTerm}
                  disabled={!selectedTerm || starting}
                  style={{
                    background: (!selectedTerm || starting) ? '#94a3b8' : '#0a1f4e',
                    color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                    border: 'none', cursor: (!selectedTerm || starting) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {starting ? 'Starting...' : 'Start new term'}
                </button>
              </div>
            </div>

            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Subscription invoice</h2>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '16px'}}>
                Generate your FeeTracker subscription invoice for {new Date().toLocaleString('en-KE', { month: 'long', year: 'numeric' })}.
                Plan: <strong>{getPlanDetails(studentCount).name}</strong> — KES {getPlanDetails(studentCount).monthly.toLocaleString()}/month.
              </p>
              <div className="set-invoice-row" style={{display: 'flex', gap: '10px'}}>
                <button
                  onClick={downloadInvoice}
                  style={{flex: 1, background: '#0a1f4e', color: '#fff', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
                >
                  Download Invoice PDF
                </button>
                <button
                  onClick={sendInvoiceWhatsApp}
                  style={{flex: 1, background: '#25D366', color: '#fff', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
                >
                  Send via WhatsApp
                </button>
              </div>
            </div>

            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px'}}>
              <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px'}}>Term history</h2>
              {terms.length === 0 ? (
                <p style={{fontSize: '13px', color: '#94a3b8'}}>No terms created yet.</p>
              ) : (
                terms.map((term, i) => (
                  <div key={term.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < terms.length - 1 ? '1px solid #f1f5f9' : 'none'}}>
                    <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>{term.name}</span>
                    <span style={{fontSize: '11px', color: '#94a3b8'}}>
                      {new Date(term.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
