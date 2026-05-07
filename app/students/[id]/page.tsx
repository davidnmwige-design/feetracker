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
  const w = 210
  doc.setDrawColor(10, 31, 78); doc.setLineWidth(4); doc.line(20, 15, w - 20, 15)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(10, 31, 78)
  doc.text(data.school.name.toUpperCase(), w / 2, 30, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(120, 120, 120)
  doc.text(data.school.term, w / 2, 38, { align: 'center' })
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3); doc.line(20, 44, w - 20, 44)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(10, 31, 78)
  doc.text('FEE CLEARANCE CERTIFICATE', w / 2, 58, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(80, 80, 80)
  doc.text('This certifies that the student below has settled all fee', w / 2, 70, { align: 'center' })
  doc.text('obligations for the current academic term.', w / 2, 77, { align: 'center' })
  const rows = [
    ['Student Name', data.student.name],
    ['Admission No', data.student.admNo],
    ['Class', data.student.class + ' ' + data.student.stream],
    ['Fee Required', 'KES ' + data.student.feeRequired.toLocaleString()],
    ['Total Paid', 'KES ' + data.student.totalPaid.toLocaleString()],
    ['Outstanding Balance', 'KES 0'],
  ]
  let y = 92
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 120, 120); doc.setFontSize(9); doc.text(label, 40, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20); doc.setFontSize(10); doc.text(value, 105, y)
    doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.2); doc.line(40, y + 3, w - 40, y + 3)
    y += 14
  })
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(10, 31, 78)
  doc.text('Status: CLEARED', w / 2, y + 10, { align: 'center' })
  doc.setDrawColor(10, 31, 78); doc.setLineWidth(0.4)
  doc.line(40, 230, 90, 230); doc.line(120, 230, 170, 230)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100)
  doc.text('Bursar', 65, 236, { align: 'center' }); doc.text('Principal', 145, 236, { align: 'center' })
  doc.text(data.school.name, 65, 242, { align: 'center' }); doc.text(data.school.name, 145, 242, { align: 'center' })
  doc.setDrawColor(10, 31, 78); doc.setLineWidth(4); doc.line(20, 270, w - 20, 270)
  doc.setFontSize(8); doc.setTextColor(160, 160, 160)
  doc.text('Generated by FeeTracker · ' + new Date().toLocaleDateString('en-KE'), w / 2, 278, { align: 'center' })
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
  }, [id])

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
          <InfoRow label="Parent name" value={student.parentName} />
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f1f5f9'}}>
            <span style={{fontSize: '13px', color: '#64748b'}}>Phone</span>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '13px', fontWeight: 600, color: '#0f172a'}}>{student.parentPhone || '—'}</span>
              {student.parentPhone && (
                <a
                  href={`https://wa.me/${whatsappPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{background: '#25D366', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', textDecoration: 'none'}}
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0'}}>
            <span style={{fontSize: '13px', color: '#64748b'}}>Email</span>
            {student.parentEmail ? (
              <a href={`mailto:${student.parentEmail}`} style={{fontSize: '13px', fontWeight: 600, color: '#0a1f4e', textDecoration: 'none'}}>
                {student.parentEmail}
              </a>
            ) : (
              <span style={{fontSize: '13px', color: '#94a3b8'}}>—</span>
            )}
          </div>
        </div>

        {/* Financial Records */}
        <div style={sectionStyle}>
          <h2 style={sectionTitle}>Financial records</h2>
          <p style={sectionSubtitle}>Fee summary for {student.school?.currentTerm}</p>

          <div className="det-metric-row" style={{display: 'flex', gap: '12px', marginBottom: '16px'}}>
            {[
              { label: 'Fee required', value: `KES ${student.feeRequired.toLocaleString()}`, color: '#0f172a' },
              { label: 'Total paid', value: `KES ${paid.toLocaleString()}`, color: '#0a1f4e' },
              { label: 'Balance', value: `KES ${Math.max(balance, 0).toLocaleString()}`, color: balance > 0 ? '#e24b4a' : '#0a7c3e' },
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
