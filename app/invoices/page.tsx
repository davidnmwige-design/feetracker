'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── PDF builder ───────────────────────────────────────────────────────────────

async function buildInvoicePdf(school: any, student: any, totalPaid: number) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const term = school.currentTerm || ''

  const today = new Date()
  const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const todayStr = today.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const dueDateStr = dueDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const invoiceNo = `INV-${today.getFullYear()}-${(student.admNo || 'STU').replace(/\//g, '-')}`
  const totalDue = Math.max(0, student.feeRequired - totalPaid)

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
  doc.text(`Adm No: ${student.admNo}`, 25, y + 20)
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
  if (student.tuitionFee > 0) feeRows.push(['Tuition Fee', student.tuitionFee])
  if (student.sportsFee > 0) feeRows.push(['Sports Fee', student.sportsFee])
  if (student.clubsFee > 0) feeRows.push(['Clubs Fee', student.clubsFee])
  if (student.otherFee > 0) feeRows.push(['Other Fee', student.otherFee])
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

  // Payment instructions
  if (school.paybill) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(10, 31, 78)
    doc.text('Payment Instructions', 20, y)
    y += 7
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105)
    doc.text(`Pay to ${school.name} via MPESA`, 20, y)
    y += 7
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(15, 23, 42)
    doc.text(`Paybill: ${school.paybill}`, 20, y)
    y += 7
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105)
    doc.text(`Payment due by: ${dueDateStr}`, 20, y)
  }

  // Navy footer
  doc.setFillColor(10, 31, 78); doc.rect(0, 272, W, 25, 'F')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(170, 195, 225)
  doc.text(`For queries contact ${school.name}`, W / 2, 281, { align: 'center' })
  doc.setTextColor(200, 168, 75)
  doc.text('Powered by FeeTracker', W / 2, 289, { align: 'center' })

  return doc
}

// ── Invoice email HTML ────────────────────────────────────────────────────────

function invoiceEmailHtml({
  schoolName, parentName, studentName, term, totalDue, dueDateStr,
}: {
  schoolName: string; parentName: string; studentName: string
  term: string; totalDue: number; dueDateStr: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#0a1f4e;padding:24px;text-align:center">
        <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:22px">FeeTracker</h1>
        <p style="color:#94a3c8;margin:6px 0 0;font-size:12px">${schoolName}</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:18px;margin-bottom:8px">Fee Invoice</h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px">
          Dear ${parentName},<br>please find attached the fee invoice for <strong>${studentName}</strong> for ${term}.
        </p>
        <div style="background:#f8f9fc;border-radius:8px;padding:20px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:13px">Student</td>
              <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">${studentName}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0">
              <td style="padding:8px 0;color:#64748b;font-size:13px">Term</td>
              <td style="text-align:right;font-size:13px">${term}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0">
              <td style="padding:8px 0;color:#64748b;font-size:13px">Total Amount Due</td>
              <td style="text-align:right;font-weight:700;color:#0a1f4e;font-size:15px">KES ${totalDue.toLocaleString()}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0">
              <td style="padding:8px 0;color:#64748b;font-size:13px">Payment Due By</td>
              <td style="text-align:right;font-size:13px">${dueDateStr}</td>
            </tr>
          </table>
        </div>
        <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0">
          Please make payment via MPESA and retain the attached invoice for your records.
          For queries, contact ${schoolName}.
        </p>
      </div>
      <div style="padding:16px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">FeeTracker &middot; support@feetracker.co.ke</p>
      </div>
    </div>
  `
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    paid:  { bg: '#e1f5ee', color: '#166534' },
    sent:  { bg: '#dbeafe', color: '#1e40af' },
    draft: { bg: '#f1f5f9', color: '#475569' },
  }
  const s = styles[status] || styles.draft
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '10px', padding: '3px 9px', borderRadius: '999px', fontWeight: 700, textTransform: 'capitalize' as const }}>
      {status}
    </span>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Invoices() {
  const [students, setStudents] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [invoices, setInvoices] = useState<Record<number, any>>({}) // studentId → invoice
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sending, setSending] = useState<Record<number, boolean>>({})
  const [sentNow, setSentNow] = useState<Set<number>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [bulkState, setBulkState] = useState<{ running: boolean; done: number; total: number; summary: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/students').then(r => r.json()),
      fetch('/api/school').then(r => r.json()),
    ]).then(([stuData, schoolData]) => {
      setStudents(Array.isArray(stuData) ? stuData : [])
      setSchool(schoolData)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!school) return
    fetch('/api/invoices')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return
        const map: Record<number, any> = {}
        data.forEach((inv: any) => { map[inv.studentId] = inv })
        setInvoices(map)
      })
  }, [school])

  function getTotalPaid(student: any) {
    return student.payments?.reduce((s: number, p: any) => s + p.amount, 0) ?? 0
  }

  function getTotalDue(student: any) {
    return Math.max(0, student.feeRequired - getTotalPaid(student))
  }

  function getStatus(student: any): string {
    return invoices[student.id]?.status || 'draft'
  }

  function buildBreakdown(student: any, totalPaid: number) {
    return {
      tuitionFee: student.tuitionFee,
      sportsFee: student.sportsFee,
      clubsFee: student.clubsFee,
      otherFee: student.otherFee,
      totalFee: student.feeRequired,
      totalPaid,
      totalDue: Math.max(0, student.feeRequired - totalPaid),
    }
  }

  async function saveInvoiceStatus(studentId: number, student: any, status: string) {
    const totalPaid = getTotalPaid(student)
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        status,
        amount: getTotalDue(student),
        breakdown: buildBreakdown(student, totalPaid),
      }),
    })
    const inv = await res.json()
    setInvoices(prev => ({ ...prev, [studentId]: inv }))
  }

  async function sendInvoiceEmail(student: any) {
    if (!student.parentEmail) return
    setSending(prev => ({ ...prev, [student.id]: true }))
    try {
      const totalPaid = getTotalPaid(student)
      const totalDue = getTotalDue(student)
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const dueDateStr = dueDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })

      const doc = await buildInvoicePdf(school, student, totalPaid)
      const pdfBase64 = doc.output('datauristring').split(',')[1]
      const term = school.currentTerm || ''

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: student.parentEmail,
          subject: `Fee Invoice — ${student.name} — ${term} — ${school.name}`,
          html: invoiceEmailHtml({
            schoolName: school.name,
            parentName: student.parentName || 'Parent',
            studentName: student.name,
            term,
            totalDue,
            dueDateStr,
          }),
          pdfBase64,
          pdfFilename: `Invoice_${student.name.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}.pdf`,
        }),
      })

      await saveInvoiceStatus(student.id, student, 'sent')
      setSentNow(prev => new Set([...prev, student.id]))
    } finally {
      setSending(prev => ({ ...prev, [student.id]: false }))
    }
  }

  function sendInvoiceWhatsApp(student: any) {
    if (!student.parentPhone) return
    const totalPaid = getTotalPaid(student)
    const totalDue = getTotalDue(student)
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const dueDateStr = dueDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    const term = school.currentTerm || ''
    const cls = `${student.class}${student.stream ? ' ' + student.stream : ''}`

    const lines = [`Dear ${student.parentName || 'Parent'}, here is the fee invoice for ${student.name} (${cls}) for ${term}:`]
    if (student.tuitionFee > 0) lines.push(`• Tuition: KES ${student.tuitionFee.toLocaleString()}`)
    if (student.sportsFee > 0) lines.push(`• Sports: KES ${student.sportsFee.toLocaleString()}`)
    if (student.clubsFee > 0) lines.push(`• Clubs: KES ${student.clubsFee.toLocaleString()}`)
    if (student.otherFee > 0) lines.push(`• Other: KES ${student.otherFee.toLocaleString()}`)
    lines.push(`• Amount paid: KES ${totalPaid.toLocaleString()}`)
    lines.push(`• *TOTAL DUE: KES ${totalDue.toLocaleString()}*`)
    if (school.paybill) lines.push(`\nPlease pay to paybill ${school.paybill} by ${dueDateStr}.`)
    lines.push(`— ${school.name}`)

    const waPhone = '254' + student.parentPhone.replace(/\s/g, '').replace(/^0/, '')
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')

    saveInvoiceStatus(student.id, student, 'sent')
    setSentNow(prev => new Set([...prev, student.id]))
  }

  async function runBulkSend() {
    setBulkConfirm(false)
    const eligible = filtered
    setBulkState({ running: true, done: 0, total: eligible.length, summary: '' })

    let emailSent = 0
    let waSent = 0
    let skipped = 0

    for (let i = 0; i < eligible.length; i++) {
      const s = eligible[i]
      setBulkState(prev => prev ? { ...prev, done: i } : null)

      if (s.parentEmail) {
        try { await sendInvoiceEmail(s); emailSent++ } catch { skipped++ }
      } else if (s.parentPhone) {
        sendInvoiceWhatsApp(s)
        waSent++
        await new Promise(r => setTimeout(r, 1500))
      } else {
        skipped++
      }
    }

    setBulkState({
      running: false,
      done: eligible.length,
      total: eligible.length,
      summary: `${emailSent} email${emailSent !== 1 ? 's' : ''} sent, ${waSent} via WhatsApp, ${skipped} skipped (no contact).`,
    })
  }

  const q = search.toLowerCase()
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.class || '').toLowerCase().includes(q) ||
    (s.admNo || '').toLowerCase().includes(q)
  )

  const draftCount = filtered.filter(s => getStatus(s) === 'draft').length

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 768px) {
          .inv-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .inv-content { padding: 16px !important; }
          .inv-toolbar { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .inv-table-wrap td, .inv-table-wrap th { padding: 8px 10px !important; font-size: 11px !important; }
        }
      `}</style>

      {/* Header */}
      <div className="inv-header" style={{ background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px' }}>Invoices</h1>
          <p style={{ fontSize: '12px', color: '#94a3c8' }}>{school?.currentTerm || '—'} · {students.length} students</p>
        </div>
        <Link href="/dashboard" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none' }}>
          ← Dashboard
        </Link>
      </div>

      <div className="inv-content" style={{ padding: '24px 32px' }}>
        {/* Bulk send confirmation dialog */}
        {bulkConfirm && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Send invoices to all {filtered.length} students?</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.6 }}>
              Parents with email on file will receive an email with a PDF invoice attached.
              Parents with only a phone number will be contacted via WhatsApp. Parents with neither will be skipped.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={runBulkSend} style={{ background: '#c8a84b', color: '#0a1f4e', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Continue
              </button>
              <button onClick={() => setBulkConfirm(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bulk progress / summary */}
        {bulkState && (
          <div style={{ background: bulkState.running ? '#fff' : '#e1f5ee', border: `1px solid ${bulkState.running ? '#e2e8f0' : '#bbf7d0'}`, borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            {bulkState.running ? (
              <p style={{ fontSize: '13px', color: '#0f172a', margin: 0 }}>
                Sending invoices… {bulkState.done} / {bulkState.total}
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: '#166534', margin: 0 }}>✓ Done. {bulkState.summary}</p>
            )}
            {!bulkState.running && (
              <button onClick={() => setBulkState(null)} style={{ marginTop: '8px', fontSize: '12px', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Dismiss</button>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="inv-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' as const }}>
          <input
            type="text"
            placeholder="Search by name, class, or admission no…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', width: '280px', outline: 'none' }}
          />
          <button
            onClick={() => setBulkConfirm(true)}
            disabled={filtered.length === 0 || !!bulkState?.running}
            style={{ background: '#c8a84b', color: '#0a1f4e', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, opacity: filtered.length === 0 ? 0.5 : 1 }}
          >
            Send invoices to all {filtered.length > 0 ? `(${filtered.length})` : ''}
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              {students.length === 0 ? 'No students found. Import students first.' : 'No students match your search.'}
            </div>
          ) : (
            <div className="inv-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px', minWidth: '860px' }}>
                <thead>
                  <tr style={{ textAlign: 'left' as const, borderBottom: '1px solid #f1f5f9' }}>
                    {['Student', 'Class', 'Fee breakdown', 'Paid', 'Due', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(student => {
                    const totalPaid = getTotalPaid(student)
                    const totalDue = getTotalDue(student)
                    const status = getStatus(student)
                    const isSending = sending[student.id]
                    const wasSent = sentNow.has(student.id)
                    const hasEmail = !!student.parentEmail
                    const hasPhone = !!student.parentPhone
                    const hasFeeBreakdown = student.tuitionFee > 0 || student.sportsFee > 0 || student.clubsFee > 0 || student.otherFee > 0

                    return (
                      <tr key={student.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{student.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{student.admNo}</div>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{student.class}{student.stream ? ' ' + student.stream : ''}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {hasFeeBreakdown ? (
                            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.6 }}>
                              {student.tuitionFee > 0 && <div>Tuition: KES {student.tuitionFee.toLocaleString()}</div>}
                              {student.sportsFee > 0 && <div>Sports: KES {student.sportsFee.toLocaleString()}</div>}
                              {student.clubsFee > 0 && <div>Clubs: KES {student.clubsFee.toLocaleString()}</div>}
                              {student.otherFee > 0 && <div>Other: KES {student.otherFee.toLocaleString()}</div>}
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>KES {student.feeRequired.toLocaleString()}</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#166534', fontWeight: 600, whiteSpace: 'nowrap' }}>KES {totalPaid.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', color: totalDue > 0 ? '#dc2626' : '#166534', fontWeight: 600, whiteSpace: 'nowrap' }}>KES {totalDue.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {wasSent ? (
                            <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '10px', padding: '3px 9px', borderRadius: '999px', fontWeight: 700 }}>Sent ✓</span>
                          ) : (
                            <StatusBadge status={status} />
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' as const }}>
                            {hasEmail ? (
                              <button
                                onClick={() => sendInvoiceEmail(student)}
                                disabled={isSending}
                                style={{ fontSize: '11px', background: isSending ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: isSending ? 'not-allowed' : 'pointer', fontWeight: 600, whiteSpace: 'nowrap' as const }}
                              >
                                {isSending ? '…' : '✉ Email'}
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8', padding: '5px 0' }}>No email</span>
                            )}
                            {hasPhone && (
                              <button
                                onClick={() => sendInvoiceWhatsApp(student)}
                                style={{ fontSize: '11px', background: '#25D366', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' as const }}
                              >
                                WhatsApp
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary footer */}
        {!loading && students.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' as const }}>
            {(['draft', 'sent', 'paid'] as const).map(s => {
              const count = students.filter(st => (invoices[st.id]?.status || 'draft') === s).length
              const colors: Record<string, string> = { draft: '#94a3b8', sent: '#1e40af', paid: '#166534' }
              return (
                <span key={s} style={{ color: colors[s] }}>
                  {count} {s}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
