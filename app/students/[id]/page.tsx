'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

function clearanceCertEmailHtml({
  schoolName, parentName, studentName, studentClass, term, feeRequired, totalPaid,
}: { schoolName: string; parentName: string; studentName: string; studentClass: string; term: string; feeRequired: number; totalPaid: number }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#0a1f4e;padding:24px;text-align:center">
        <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:22px">FeeTracker</h1>
        <p style="color:#94a3c8;margin:6px 0 0;font-size:12px">${schoolName}</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:18px;margin-bottom:4px">Fee Clearance Certificate</h2>
        <p style="color:#c8a84b;font-size:12px;margin-bottom:20px">${term}</p>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px">Dear ${parentName},<br>please find attached the fee clearance certificate for ${studentName}.</p>
        <div style="background:#f8f9fc;border-radius:8px;padding:20px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Student</td><td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">${studentName}</td></tr>
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;color:#64748b;font-size:13px">Class</td><td style="text-align:right;font-size:13px">${studentClass}</td></tr>
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;color:#64748b;font-size:13px">Fee Required</td><td style="text-align:right;font-size:13px">KES ${feeRequired.toLocaleString()}</td></tr>
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;color:#64748b;font-size:13px">Total Paid</td><td style="text-align:right;font-weight:700;color:#0a1f4e;font-size:13px">KES ${totalPaid.toLocaleString()}</td></tr>
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;color:#64748b;font-size:13px">Balance</td><td style="text-align:right;font-weight:700;color:#0a7c3e;font-size:13px">KES 0 — CLEARED</td></tr>
          </table>
        </div>
        <p style="color:#64748b;font-size:13px">Please retain the attached PDF certificate for your records.</p>
      </div>
      <div style="padding:16px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">FeeTracker &middot; support@feetracker.co.ke</p>
      </div>
    </div>`
}

function reminderEmailHtml({
  schoolName, parentName, studentName, studentClass, term, feeRequired, paid, balance,
}: { schoolName: string; parentName: string; studentName: string; studentClass: string; term: string; feeRequired: number; paid: number; balance: number }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#0a1f4e;padding:24px;text-align:center">
        <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:22px">FeeTracker</h1>
        <p style="color:#94a3c8;margin:6px 0 0;font-size:12px">${schoolName}</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:18px;margin-bottom:8px">Fee Payment Reminder</h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px">Dear ${parentName},<br>this is a friendly reminder that ${studentName} has an outstanding fee balance for ${term}.</p>
        <div style="background:#f8f9fc;border-radius:8px;padding:20px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Student</td><td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">${studentName}</td></tr>
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;color:#64748b;font-size:13px">Class</td><td style="text-align:right;font-size:13px">${studentClass}</td></tr>
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;color:#64748b;font-size:13px">Fee Required</td><td style="text-align:right;font-size:13px">KES ${feeRequired.toLocaleString()}</td></tr>
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;color:#64748b;font-size:13px">Amount Paid</td><td style="text-align:right;font-weight:700;color:#0a1f4e;font-size:13px">KES ${paid.toLocaleString()}</td></tr>
            <tr style="border-top:1px solid #e2e8f0"><td style="padding:8px 0;color:#64748b;font-size:13px">Outstanding Balance</td><td style="text-align:right;font-weight:700;color:#e24b4a;font-size:14px">KES ${balance.toLocaleString()}</td></tr>
          </table>
        </div>
        <p style="color:#64748b;font-size:13px">Please settle the outstanding balance at your earliest convenience. Contact the school if you have any questions.</p>
      </div>
      <div style="padding:16px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">FeeTracker &middot; support@feetracker.co.ke</p>
      </div>
    </div>`
}

async function buildCertificateDoc(data: any) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const term = data.school?.currentTerm || data.school?.term || ''
  const schoolName = data.school?.name || ''

  // Double border (drawn first so everything sits on top)
  doc.setDrawColor(10, 31, 78); doc.setLineWidth(1.5); doc.rect(8, 8, W - 16, 281)
  doc.setLineWidth(0.4); doc.rect(11, 11, W - 22, 275)

  // Navy header block
  doc.setFillColor(10, 31, 78); doc.rect(0, 0, W, 44, 'F')
  // Gold rule
  doc.setFillColor(200, 168, 75); doc.rect(0, 44, W, 2.5, 'F')

  // Watermark — drawn before body content so text renders on top
  doc.setFont('helvetica', 'bold'); doc.setFontSize(88); doc.setTextColor(215, 222, 237)
  doc.text('CLEARED', W / 2, 178, { align: 'center', angle: 45 })

  // School name — large, gold
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(200, 168, 75)
  doc.text(schoolName.toUpperCase(), W / 2, 17, { align: 'center' })
  // "OFFICIAL DOCUMENT" in small gold, letter-spaced
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(200, 168, 75)
  doc.setCharSpace(2.5); doc.text('OFFICIAL DOCUMENT', W / 2, 27, { align: 'center' }); doc.setCharSpace(0)
  // Term
  doc.setFontSize(10); doc.setTextColor(170, 195, 225)
  doc.text(term, W / 2, 37, { align: 'center' })

  // Certificate title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(10, 31, 78)
  doc.text('FEE CLEARANCE CERTIFICATE', W / 2, 64, { align: 'center' })
  doc.setFillColor(200, 168, 75); doc.rect(38, 68, 134, 1, 'F')

  // "This is to certify that:"
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(100, 116, 139)
  doc.text('This is to certify that:', W / 2, 82, { align: 'center' })

  // Student name
  doc.setFont('helvetica', 'bold'); doc.setFontSize(23); doc.setTextColor(10, 31, 78)
  doc.text(data.student.name.toUpperCase(), W / 2, 95, { align: 'center' })
  // Adm No | Class
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139)
  const classStr = `${data.student.class}${data.student.stream ? ' ' + data.student.stream : ''}`
  doc.text(`Admission No: ${data.student.admNo}   |   Class: ${classStr}`, W / 2, 104, { align: 'center' })

  // "has fully settled..."
  doc.setFontSize(11); doc.text('has fully settled all fee obligations for', W / 2, 117, { align: 'center' })
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(10, 31, 78)
  doc.text(term, W / 2, 126, { align: 'center' })

  // Fee detail box
  doc.setFillColor(248, 249, 252); doc.setDrawColor(220, 228, 240); doc.setLineWidth(0.3)
  doc.rect(36, 134, 138, 46, 'FD')
  const feeRows: [string, string, number, number, number][] = [
    ['Total fees required:', 'KES ' + data.student.feeRequired.toLocaleString(), 100, 116, 139],
    ['Total amount paid:', 'KES ' + data.student.totalPaid.toLocaleString(), 10, 124, 78],
    ['Outstanding balance:', 'KES 0', 10, 124, 78],
  ]
  feeRows.forEach(([label, value, r, g, b], i) => {
    const y = 148 + i * 13
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(label, 44, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(r, g, b); doc.text(value, W - 44, y, { align: 'right' })
  })

  // CLEARED stamp
  doc.setDrawColor(10, 124, 78); doc.setLineWidth(1); doc.rect(74, 188, 62, 21)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(10, 124, 78)
  doc.text('CLEARED', W / 2, 202, { align: 'center' })

  // Signature lines
  doc.setDrawColor(180, 192, 215); doc.setLineWidth(0.4)
  doc.line(24, 228, 90, 228); doc.line(120, 228, 186, 228)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(10, 31, 78)
  doc.text('Bursar', 57, 234, { align: 'center' }); doc.text('Principal', 153, 234, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(130, 140, 158)
  doc.text('Authorised Signatory', 57, 240, { align: 'center' })
  doc.text('Authorised Signatory', 153, 240, { align: 'center' })
  doc.text(schoolName, 57, 246, { align: 'center' }); doc.text(schoolName, 153, 246, { align: 'center' })

  // Date issued
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
  doc.text('Date issued: ' + today, W / 2, 258, { align: 'center' })

  // Validity notice
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(150, 162, 178)
  doc.text('This certificate is valid for ' + term + ' only.', W / 2, 265, { align: 'center' })

  // Navy footer
  doc.setFillColor(10, 31, 78); doc.rect(0, 272, W, 25, 'F')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 168, 75)
  doc.text('Generated by FeeTracker · support@feetracker.co.ke', W / 2, 282, { align: 'center' })

  return doc
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f1f5f9'}}>
      <span style={{fontSize: '13px', color: '#64748b'}}>{label}</span>
      <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a', textAlign: 'right', maxWidth: '60%'}}>{value || '—'}</span>
    </div>
  )
}

function EmailModal({ title, subtitle, emailValue, onEmailChange, onSend, onClose, sending, result, inputRef }: any) {
  return (
    <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'}}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{background: '#fff', borderRadius: '12px', padding: '28px', width: '400px', maxWidth: '92vw'}}>
        <h3 style={{fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>{title}</h3>
        <p style={{fontSize: '12px', color: '#64748b', marginBottom: '20px'}}>{subtitle}</p>
        <label style={{fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px'}}>Email address</label>
        <input
          ref={inputRef}
          type="email"
          value={emailValue}
          onChange={e => onEmailChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSend()}
          placeholder="parent@example.com"
          style={{width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}}
        />
        {result === 'sent' && <p style={{fontSize: '12px', color: '#0a7c3e', marginTop: '10px', fontWeight: 600}}>Sent successfully!</p>}
        {result === 'error' && <p style={{fontSize: '12px', color: '#e24b4a', marginTop: '10px'}}>Failed to send. Check your email configuration.</p>}
        <div style={{display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end'}}>
          <button onClick={onClose} style={{padding: '8px 16px', borderRadius: '6px', fontSize: '13px', background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b'}}>Cancel</button>
          <button
            onClick={onSend}
            disabled={sending || !emailValue.trim()}
            style={{padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, background: sending || !emailValue.trim() ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', cursor: sending || !emailValue.trim() ? 'not-allowed' : 'pointer'}}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StudentDetail() {
  const { id } = useParams()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [feeCategories, setFeeCategories] = useState<any[]>([])
  const [editingFees, setEditingFees] = useState(false)
  const [feeEdits, setFeeEdits] = useState<{name: string; amount: number}[]>([])
  const [savingFees, setSavingFees] = useState(false)

  const [certModal, setCertModal] = useState(false)
  const [certEmail, setCertEmail] = useState('')
  const [certSending, setCertSending] = useState(false)
  const [certResult, setCertResult] = useState<'sent' | 'error' | null>(null)
  const certInputRef = useRef<HTMLInputElement>(null)

  const [reminderModal, setReminderModal] = useState(false)
  const [reminderEmail, setReminderEmail] = useState('')
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderResult, setReminderResult] = useState<'sent' | 'error' | null>(null)
  const reminderInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/students/' + id)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then(data => { if (data) { setStudent(data); setLoading(false) } })
      .catch(() => { setNotFound(true); setLoading(false) })
    fetch('/api/fee-categories?studentId=' + id)
      .then(r => r.json()).then(d => setFeeCategories(Array.isArray(d) ? d : []))
  }, [id])

  function startEditFees() {
    const cats = feeCategories.length > 0
      ? feeCategories.map(c => ({ name: c.name, amount: c.amount }))
      : [{ name: 'Tuition Fee', amount: 0 }]
    setFeeEdits(cats)
    setEditingFees(true)
  }

  async function saveFees() {
    if (savingFees) return
    setSavingFees(true)
    const res = await fetch('/api/fee-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: id, categories: feeEdits }) })
    const data = await res.json()
    if (res.ok) {
      setFeeCategories(data.categories)
      setStudent((prev: any) => prev ? { ...prev, feeRequired: data.total } : prev)
      setEditingFees(false)
    }
    setSavingFees(false)
  }

  useEffect(() => { if (certModal) setTimeout(() => certInputRef.current?.focus(), 50) }, [certModal])
  useEffect(() => { if (reminderModal) setTimeout(() => reminderInputRef.current?.focus(), 50) }, [reminderModal])

  async function downloadCert() {
    const res = await fetch('/api/certificate?studentId=' + id)
    const data = await res.json()
    const doc = await buildCertificateDoc(data)
    doc.save(student.name.replace(/\s+/g, '_') + '_clearance.pdf')
  }

  async function sendCertEmail() {
    if (!certEmail.trim() || certSending) return
    setCertSending(true); setCertResult(null)
    try {
      const certRes = await fetch('/api/certificate?studentId=' + id)
      const certData = await certRes.json()
      const doc = await buildCertificateDoc(certData)
      const pdfBase64 = doc.output('datauristring').split(',')[1]
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: certEmail.trim(),
          subject: `Fee Clearance Certificate — ${student.name} — ${student.school?.currentTerm}`,
          html: clearanceCertEmailHtml({
            schoolName: student.school?.name || '',
            parentName: student.parentName || 'Parent',
            studentName: student.name,
            studentClass: `${student.class} ${student.stream || ''}`.trim(),
            term: student.school?.currentTerm || '',
            feeRequired: student.feeRequired,
            totalPaid: paid,
          }),
          pdfBase64,
          pdfFilename: student.name.replace(/\s+/g, '_') + '_clearance.pdf',
        }),
      })
      setCertResult(res.ok ? 'sent' : 'error')
      if (res.ok) setTimeout(() => { setCertModal(false); setCertResult(null) }, 2000)
    } catch { setCertResult('error') }
    setCertSending(false)
  }

  async function sendReminderEmail() {
    if (!reminderEmail.trim() || reminderSending) return
    setReminderSending(true); setReminderResult(null)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: reminderEmail.trim(),
          subject: `Fee payment reminder — ${student.name}`,
          html: reminderEmailHtml({
            schoolName: student.school?.name || '',
            parentName: student.parentName || 'Parent',
            studentName: student.name,
            studentClass: `${student.class} ${student.stream || ''}`.trim(),
            term: student.school?.currentTerm || '',
            feeRequired: student.feeRequired,
            paid,
            balance,
          }),
        }),
      })
      setReminderResult(res.ok ? 'sent' : 'error')
      if (res.ok) setTimeout(() => { setReminderModal(false); setReminderResult(null) }, 2000)
    } catch { setReminderResult('error') }
    setReminderSending(false)
  }

  if (loading) return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif'}}>
      <span style={{color: '#94a3b8', fontSize: '14px'}}>Loading...</span>
    </div>
  )

  if (notFound) return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', gap: '12px'}}>
      <span style={{color: '#64748b', fontSize: '14px'}}>Student not found.</span>
      <Link href="/students" style={{color: '#0a1f4e', fontSize: '13px', fontWeight: 600}}>← Back to students</Link>
    </div>
  )

  const paid = student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
  const balance = student.feeRequired - paid
  const cleared = balance <= 0

  // Penalty calculation
  const school = student.school
  const penaltyEnabled = school?.penaltyEnabled && balance > 0
  const today = new Date()
  const pastDueDate = penaltyEnabled && today.getDate() > (school?.penaltyDueDate || 15)
  const penaltyAmt = pastDueDate
    ? school?.penaltyType === 'percentage'
      ? Math.round(balance * (school?.penaltyAmount || 0) / 100)
      : (school?.penaltyAmount || 0)
    : 0
  const totalWithPenalty = balance + penaltyAmt
  const partial = paid > 0 && !cleared
  const progressPct = student.feeRequired > 0 ? Math.min((paid / student.feeRequired) * 100, 100) : 0
  const statusLabel = cleared ? 'Paid' : partial ? 'Partial' : 'Unpaid'
  const statusBg = cleared ? '#e1f5ee' : partial ? '#fef9ec' : '#fcebeb'
  const statusColor = cleared ? '#0a7c3e' : partial ? '#92681a' : '#a32d2d'

  const rawPhone = student.parentPhone || ''
  const whatsappPhone = rawPhone.replace(/^0/, '254').replace(/\D/g, '')
  const whatsappMsg = `Dear ${student.parentName || 'Parent'}, this is a reminder that ${student.name} has an outstanding fee balance of KES ${balance.toLocaleString()} for ${student.school?.currentTerm || 'the current term'}. Please make payment at your earliest convenience. Thank you — ${student.school?.name || 'School'}.`

  const sectionStyle = { background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }
  const sectionTitle = { fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }
  const sectionSubtitle = { fontSize: '12px', color: '#94a3b8', marginBottom: '14px', margin: '0 0 14px' }

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden'}}>
      <style>{`
        @media (max-width: 640px) {
          .det-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .det-content { padding: 16px !important; }
          .det-metric-row { flex-direction: column !important; }
          .det-action-row { flex-wrap: wrap !important; }
        }
      `}</style>

      <div className="det-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '4px'}}>{student.name}</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>
            {student.admNo} &middot; {student.class}{student.stream ? ' ' + student.stream : ''}
          </p>
        </div>
        <Link href="/students" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap'}}>
          ← Students
        </Link>
      </div>

      <div className="det-content" style={{padding: '24px 32px', maxWidth: '800px'}}>

        {/* Student Profile */}
        <div style={sectionStyle}>
          <h2 style={sectionTitle}>Student profile</h2>
          <p style={sectionSubtitle}>Enrolment details</p>
          <InfoRow label="Admission No" value={student.admNo} />
          <InfoRow label="Class" value={`${student.class}${student.stream ? ' ' + student.stream : ''}`} />
          <InfoRow label="School" value={student.school?.name} />
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0'}}>
            <span style={{fontSize: '13px', color: '#64748b'}}>Current term</span>
            <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>{student.school?.currentTerm || '—'}</span>
          </div>
        </div>

        {/* Parent / Guardian */}
        <div style={sectionStyle}>
          <h2 style={sectionTitle}>Parent / Guardian</h2>
          <p style={sectionSubtitle}>Contact information</p>
          <InfoRow label="Parent 1 name" value={student.parentName} />
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f1f5f9'}}>
            <span style={{fontSize: '13px', color: '#64748b'}}>Parent 1 phone</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>{student.parentPhone || '—'}</span>
              {student.parentPhone && (
                <a href={`https://wa.me/${whatsappPhone}`} target="_blank" rel="noopener noreferrer"
                  style={{background: '#25D366', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', textDecoration: 'none'}}>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: student.parent2Name ? '1px solid #f1f5f9' : 'none'}}>
            <span style={{fontSize: '13px', color: '#64748b'}}>Parent 1 email</span>
            {student.parentEmail ? (
              <a href={`mailto:${student.parentEmail}`} style={{fontSize: '13px', fontWeight: 600, color: '#0a1f4e', textDecoration: 'none'}}>{student.parentEmail}</a>
            ) : <span style={{fontSize: '13px', color: '#94a3b8'}}>—</span>}
          </div>
          {student.parent2Name && (
            <>
              <InfoRow label="Parent 2 name" value={student.parent2Name} />
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f1f5f9'}}>
                <span style={{fontSize: '13px', color: '#64748b'}}>Parent 2 phone</span>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>{student.parent2Phone || '—'}</span>
                  {student.parent2Phone && (
                    <a href={`https://wa.me/254${student.parent2Phone.replace(/\D/g, '').replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer"
                      style={{background: '#25D366', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', textDecoration: 'none'}}>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0'}}>
                <span style={{fontSize: '13px', color: '#64748b'}}>Parent 2 email</span>
                {student.parent2Email ? (
                  <a href={`mailto:${student.parent2Email}`} style={{fontSize: '13px', fontWeight: 600, color: '#0a1f4e', textDecoration: 'none'}}>{student.parent2Email}</a>
                ) : <span style={{fontSize: '13px', color: '#94a3b8'}}>—</span>}
              </div>
            </>
          )}
        </div>

        {/* Financial Records */}
        <div style={sectionStyle}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px'}}>
            <h2 style={sectionTitle}>Financial records</h2>
            <button onClick={editingFees ? () => setEditingFees(false) : startEditFees}
              style={{fontSize: '12px', background: editingFees ? 'none' : '#c8a84b', border: editingFees ? '1px solid #e2e8f0' : 'none', padding: '6px 14px', borderRadius: '5px', cursor: 'pointer', color: editingFees ? '#64748b' : '#0a1f4e', fontWeight: 700}}>
              {editingFees ? 'Cancel' : '✏ Edit fees'}
            </button>
          </div>
          <p style={sectionSubtitle}>Fee summary for {student.school?.currentTerm}</p>

          {/* Fee categories — always visible when not editing */}
          {!editingFees && feeCategories.length > 0 && (
            <div style={{background: '#fdf8ee', border: '1px solid #e2d9b8', borderRadius: '8px', padding: '14px 16px', marginBottom: '14px'}}>
              <p style={{fontSize: '11px', fontWeight: 700, color: '#92681a', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px'}}>Fee breakdown</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                {feeCategories.map((c: any) => (
                  <div key={c.id} style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={{fontSize: '13px', color: '#64748b'}}>{c.name}</span>
                    <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>KES {c.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2d9b8', paddingTop: '6px', marginTop: '2px'}}>
                  <span style={{fontSize: '13px', fontWeight: 700, color: '#0a1f4e'}}>Total</span>
                  <span style={{fontSize: '13px', fontWeight: 700, color: '#0a1f4e'}}>KES {student.feeRequired.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Edit fees form */}
          {editingFees && (
            <div style={{background: '#fdf8ee', border: '2px solid #c8a84b', borderRadius: '8px', padding: '16px', marginBottom: '16px'}}>
              <p style={{fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px'}}>Fee categories</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px'}}>
                {feeEdits.map((cat, i) => (
                  <div key={i} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <input
                      value={cat.name}
                      onChange={e => setFeeEdits(prev => prev.map((c, j) => j === i ? { ...c, name: e.target.value } : c))}
                      placeholder="Category name"
                      style={{flex: 2, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none'}}
                    />
                    <input
                      type="number"
                      value={cat.amount}
                      onChange={e => setFeeEdits(prev => prev.map((c, j) => j === i ? { ...c, amount: Number(e.target.value) } : c))}
                      placeholder="Amount"
                      style={{flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none'}}
                    />
                    <button onClick={() => setFeeEdits(prev => prev.filter((_, j) => j !== i))} style={{background: 'none', border: 'none', color: '#e24b4a', cursor: 'pointer', fontSize: '16px', padding: '0 4px'}}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap' as const}}>
                <button onClick={() => setFeeEdits(prev => [...prev, { name: '', amount: 0 }])} style={{fontSize: '12px', background: 'none', border: '1px dashed #c8a84b', color: '#92681a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer'}}>
                  + Add category
                </button>
                <button onClick={saveFees} disabled={savingFees} style={{fontSize: '13px', background: savingFees ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '7px 18px', borderRadius: '6px', cursor: savingFees ? 'not-allowed' : 'pointer', fontWeight: 700}}>
                  {savingFees ? 'Saving…' : 'Save fees'}
                </button>
              </div>
              <p style={{fontSize: '11px', color: '#94a3b8', marginTop: '8px'}}>
                Total: KES {feeEdits.reduce((s, c) => s + (Number(c.amount) || 0), 0).toLocaleString()}
              </p>
            </div>
          )}

          {/* Penalty badge */}
          {penaltyAmt > 0 && (
            <div style={{background: '#fcebeb', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <span style={{background: '#a32d2d', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', marginRight: '8px'}}>PENALTY</span>
                <span style={{fontSize: '12px', color: '#a32d2d'}}>Late payment penalty applied (after {school?.penaltyDueDate}th)</span>
              </div>
              <span style={{fontSize: '13px', fontWeight: 700, color: '#a32d2d'}}>+KES {penaltyAmt.toLocaleString()}</span>
            </div>
          )}

          <div className="det-metric-row" style={{display: 'flex', gap: '12px', marginBottom: '16px'}}>
            {[
              { label: 'Fee required', value: `KES ${student.feeRequired.toLocaleString()}`, color: '#0f172a' },
              { label: 'Total paid', value: `KES ${paid.toLocaleString()}`, color: '#0a1f4e' },
              { label: penaltyAmt > 0 ? 'Balance + Penalty' : 'Balance', value: penaltyAmt > 0 ? `KES ${Math.max(totalWithPenalty, 0).toLocaleString()}` : `KES ${Math.max(balance, 0).toLocaleString()}`, color: balance > 0 ? '#e24b4a' : '#0a7c3e' },
            ].map(card => (
              <div key={card.label} style={{flex: 1, background: '#f8f9fc', borderRadius: '8px', padding: '14px'}}>
                <p style={{fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px'}}>{card.label}</p>
                <p style={{fontSize: '17px', fontWeight: 700, color: card.color, margin: 0}}>{card.value}</p>
              </div>
            ))}
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
            <div style={{flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '8px', overflow: 'hidden'}}>
              <div style={{
                background: cleared ? '#0a7c3e' : partial ? '#c8a84b' : '#e2e8f0',
                width: progressPct + '%', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap'}}>{Math.round(progressPct)}%</span>
            <span style={{
              background: statusBg, color: statusColor,
              fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap'
            }}>
              {statusLabel}
            </span>
          </div>

          {/* Payments table */}
          <h3 style={{fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', marginTop: '20px'}}>Payment history</h3>
          {student.payments.length === 0 ? (
            <p style={{fontSize: '13px', color: '#94a3b8', padding: '12px 0'}}>No payments recorded yet.</p>
          ) : (
            <div style={{overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any}}>
              <table style={{width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px', minWidth: '520px'}}>
                <thead>
                  <tr style={{background: '#f8f9fc', borderBottom: '1px solid #e2e8f0'}}>
                    {['Date', 'MPESA Ref', 'Amount', 'Sender name', 'Sender phone'].map(h => (
                      <th key={h} style={{padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {student.payments.map((p: any) => (
                    <tr key={p.id} style={{borderBottom: '1px solid #f8fafc'}}>
                      <td style={{padding: '8px 12px', color: '#64748b', whiteSpace: 'nowrap'}}>{new Date(p.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{padding: '8px 12px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b'}}>{p.mpesaRef || '—'}</td>
                      <td style={{padding: '8px 12px', fontWeight: 700, color: '#0a1f4e', whiteSpace: 'nowrap'}}>KES {p.amount.toLocaleString()}</td>
                      <td style={{padding: '8px 12px', color: '#64748b'}}>{p.senderName || '—'}</td>
                      <td style={{padding: '8px 12px', color: '#64748b'}}>{p.senderPhone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={sectionStyle}>
          <h2 style={sectionTitle}>Actions</h2>
          <p style={sectionSubtitle}>Available actions for this student</p>
          <div className="det-action-row" style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
            {cleared && (
              <>
                <button
                  onClick={downloadCert}
                  style={{background: '#0a1f4e', color: '#fff', padding: '9px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
                >
                  Download certificate
                </button>
                <button
                  onClick={() => { setCertEmail(student.parentEmail || ''); setCertResult(null); setCertModal(true) }}
                  style={{background: '#fff', color: '#0a1f4e', padding: '9px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: '1px solid #0a1f4e', cursor: 'pointer'}}
                >
                  Send certificate via email
                </button>
              </>
            )}
            {balance > 0 && (
              <>
                {whatsappPhone && (
                  <a
                    href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{background: '#25D366', color: '#fff', padding: '9px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'inline-block'}}
                  >
                    Send WhatsApp reminder
                  </a>
                )}
                <button
                  onClick={() => { setReminderEmail(student.parentEmail || ''); setReminderResult(null); setReminderModal(true) }}
                  style={{background: '#fff', color: '#64748b', padding: '9px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: '1px solid #e2e8f0', cursor: 'pointer'}}
                >
                  Send reminder via email
                </button>
              </>
            )}
            {!cleared && balance <= 0 && !student.payments.length && (
              <p style={{fontSize: '13px', color: '#94a3b8'}}>No actions available yet.</p>
            )}
          </div>
        </div>

      </div>

      {certModal && (
        <EmailModal
          title="Send clearance certificate"
          subtitle={`${student.name} · ${student.school?.currentTerm}`}
          emailValue={certEmail}
          onEmailChange={setCertEmail}
          onSend={sendCertEmail}
          onClose={() => { setCertModal(false); setCertResult(null) }}
          sending={certSending}
          result={certResult}
          inputRef={certInputRef}
        />
      )}

      {reminderModal && (
        <EmailModal
          title="Send payment reminder"
          subtitle={`${student.name} · Balance: KES ${balance.toLocaleString()}`}
          emailValue={reminderEmail}
          onEmailChange={setReminderEmail}
          onSend={sendReminderEmail}
          onClose={() => { setReminderModal(false); setReminderResult(null) }}
          sending={reminderSending}
          result={reminderResult}
          inputRef={reminderInputRef}
        />
      )}
    </div>
  )
}
