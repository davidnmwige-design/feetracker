'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { maskEmail } from '@/lib/mask'

function clearanceCertEmailHtml({
  schoolName,
  parentName,
  studentName,
  studentClass,
  term,
  feeRequired,
  totalPaid,
}: {
  schoolName: string
  parentName: string
  studentName: string
  studentClass: string
  term: string
  feeRequired: number
  totalPaid: number
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#0a1f4e;padding:24px;text-align:center">
        <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:22px">FeeTracker</h1>
        <p style="color:#94a3c8;margin:6px 0 0;font-size:12px">${schoolName}</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:18px;margin-bottom:4px">Fee Clearance Certificate</h2>
        <p style="color:#c8a84b;font-size:12px;margin-bottom:20px">${term}</p>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px">
          Dear ${parentName},<br>please find attached the fee clearance certificate for ${studentName}.
        </p>
        <div style="background:#f8f9fc;border-radius:8px;padding:20px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:8px 0;color:#64748b;font-size:13px">Student</td>
              <td style="text-align:right;font-weight:700;color:#0f172a;font-size:13px">${studentName}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0">
              <td style="padding:8px 0;color:#64748b;font-size:13px">Class</td>
              <td style="text-align:right;font-size:13px">${studentClass}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0">
              <td style="padding:8px 0;color:#64748b;font-size:13px">Fee Required</td>
              <td style="text-align:right;font-size:13px">KES ${feeRequired.toLocaleString()}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0">
              <td style="padding:8px 0;color:#64748b;font-size:13px">Total Paid</td>
              <td style="text-align:right;font-weight:700;color:#0a1f4e;font-size:13px">KES ${totalPaid.toLocaleString()}</td>
            </tr>
            <tr style="border-top:1px solid #e2e8f0">
              <td style="padding:8px 0;color:#64748b;font-size:13px">Balance</td>
              <td style="text-align:right;font-weight:700;color:#0a7c3e;font-size:13px">KES 0 — CLEARED</td>
            </tr>
          </table>
        </div>
        <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0">
          Please retain the attached PDF certificate for your records.
        </p>
      </div>
      <div style="padding:16px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">FeeTracker &middot; support@feetracker.co.ke</p>
      </div>
    </div>
  `
}

async function buildCertificateDoc(data: any) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const term = data.school?.term || data.school?.currentTerm || ''
  const schoolName = data.school?.name || ''

  // Double border
  doc.setDrawColor(10, 31, 78); doc.setLineWidth(1.5); doc.rect(8, 8, W - 16, 281)
  doc.setLineWidth(0.4); doc.rect(11, 11, W - 22, 275)

  // Navy header + gold rule
  doc.setFillColor(10, 31, 78); doc.rect(0, 0, W, 44, 'F')
  doc.setFillColor(200, 168, 75); doc.rect(0, 44, W, 2.5, 'F')

  // Watermark (drawn first so body text renders on top)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(88); doc.setTextColor(215, 222, 237)
  doc.text('CLEARED', W / 2, 178, { align: 'center', angle: 45 })

  // School name in gold
  doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(200, 168, 75)
  doc.text(schoolName.toUpperCase(), W / 2, 17, { align: 'center' })
  // OFFICIAL DOCUMENT with letter-spacing
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(200, 168, 75)
  doc.setCharSpace(2.5); doc.text('OFFICIAL DOCUMENT', W / 2, 27, { align: 'center' }); doc.setCharSpace(0)
  // Term label
  doc.setFontSize(10); doc.setTextColor(170, 195, 225)
  doc.text(term, W / 2, 37, { align: 'center' })

  // Certificate title + gold underline
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(10, 31, 78)
  doc.text('FEE CLEARANCE CERTIFICATE', W / 2, 64, { align: 'center' })
  doc.setFillColor(200, 168, 75); doc.rect(38, 68, 134, 1, 'F')

  // Intro line
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(100, 116, 139)
  doc.text('This is to certify that:', W / 2, 80, { align: 'center' })

  // Student name (large)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(10, 31, 78)
  doc.text(data.student.name.toUpperCase(), W / 2, 92, { align: 'center' })

  // Two-column student details box
  const classStr = data.student.class + (data.student.stream ? ' ' + data.student.stream : '')
  const detailRows: [string, string][] = [
    ['Admission No.', data.student.admNo],
    ['Class / Stream', classStr],
    ['Term', term],
  ]
  const boxX = 36; const boxW = 138; const rowH = 11; const boxY = 100
  doc.setFillColor(248, 249, 252); doc.setDrawColor(220, 228, 240); doc.setLineWidth(0.3)
  doc.rect(boxX, boxY, boxW, detailRows.length * rowH + 8, 'FD')
  detailRows.forEach(([label, value], i) => {
    const y = boxY + 9 + i * rowH
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    doc.text(label, boxX + 6, y)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
    doc.text(value, boxX + boxW - 6, y, { align: 'right' })
    if (i < detailRows.length - 1) {
      doc.setDrawColor(230, 235, 245); doc.setLineWidth(0.2)
      doc.line(boxX + 2, y + 3, boxX + boxW - 2, y + 3)
    }
  })

  // Body text
  const afterBox = boxY + detailRows.length * rowH + 16
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(71, 85, 105)
  doc.text('has fully settled all fee obligations for', W / 2, afterBox, { align: 'center' })
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(10, 31, 78)
  doc.text(term, W / 2, afterBox + 9, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(71, 85, 105)
  doc.text('and is therefore cleared to sit examinations.', W / 2, afterBox + 18, { align: 'center' })

  // Fee detail box
  const feeBoxY = afterBox + 26
  doc.setFillColor(248, 249, 252); doc.setDrawColor(220, 228, 240); doc.setLineWidth(0.3)
  doc.rect(36, feeBoxY, 138, 40, 'FD')
  const feeRows: [string, string, string][] = [
    ['Fee Required', 'KES ' + data.student.feeRequired.toLocaleString(), '#64748b'],
    ['Total Paid', 'KES ' + data.student.totalPaid.toLocaleString(), '#0a7c3e'],
    ['Outstanding Balance', 'KES 0', '#0a7c3e'],
  ]
  let fy = feeBoxY + 9
  feeRows.forEach(([label, value, color]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
    doc.text(label, 44, fy)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...(color === '#64748b' ? [100, 116, 139] as [number,number,number] : [10, 124, 78] as [number,number,number]))
    doc.text(value, W - 44, fy, { align: 'right' })
    fy += 10
  })

  // CLEARED stamp box
  const stampY = feeBoxY + 50
  doc.setDrawColor(10, 124, 78); doc.setLineWidth(1); doc.rect(74, stampY, 62, 21)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(10, 124, 78)
  doc.text('CLEARED', W / 2, stampY + 14, { align: 'center' })

  // Signature lines
  const sigY = stampY + 38
  doc.setDrawColor(180, 192, 215); doc.setLineWidth(0.4)
  doc.line(24, sigY, 90, sigY); doc.line(120, sigY, 186, sigY)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(10, 31, 78)
  doc.text('Bursar', 57, sigY + 7, { align: 'center' })
  doc.text('Principal', 153, sigY + 7, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(130, 140, 158)
  doc.text('Authorised Signatory', 57, sigY + 13, { align: 'center' })
  doc.text('Authorised Signatory', 153, sigY + 13, { align: 'center' })

  // Date + validity
  const dateY = sigY + 26
  doc.setFontSize(9); doc.setTextColor(100, 116, 139)
  doc.text('Date issued: ' + today, W / 2, dateY, { align: 'center' })
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8)
  doc.text('This certificate is valid for ' + term + ' only.', W / 2, dateY + 7, { align: 'center' })

  // Navy footer
  doc.setFillColor(10, 31, 78); doc.rect(0, 272, W, 25, 'F')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 168, 75)
  doc.text('Generated by FeeTracker · support@feetracker.co.ke', W / 2, 282, { align: 'center' })

  return doc
}

export default function Students() {
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [expandedFees, setExpandedFees] = useState<number | null>(null)
  const [editingEmail, setEditingEmail] = useState<{ id: number; value: string } | null>(null)
  const [emailModal, setEmailModal] = useState<{ student: any; certData: any } | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState<'sent' | 'error' | null>(null)
  const [sentEmails, setSentEmails] = useState<Set<number>>(new Set())
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchStudents() }, [])

  useEffect(() => {
    if (emailModal) setTimeout(() => emailInputRef.current?.focus(), 50)
  }, [emailModal])

  async function fetchStudents() {
    setLoading(true)
    const res = await fetch('/api/students')
    const data = await res.json()
    setStudents(data)
    setLoading(false)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setUploadError('')
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/students', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      setUploadError(data.error || 'Upload failed')
      setUploading(false)
      return
    }
    setFile(null)
    await fetchStudents()
    setUploading(false)
  }

  async function downloadCertificate(studentId: number, studentName: string) {
    const res = await fetch('/api/certificate?studentId=' + studentId)
    const data = await res.json()
    const doc = await buildCertificateDoc(data)
    doc.save(studentName.replace(/\s+/g, '_') + '_clearance.pdf')
    return { data }
  }

  async function openEmailModal(student: any) {
    const res = await fetch('/api/certificate?studentId=' + student.id)
    const certData = await res.json()
    setEmailModal({ student, certData })
    setEmailInput(student.parentEmail || '')
    setEmailResult(null)
  }

  async function sendCertificateEmail() {
    if (!emailModal || !emailInput.trim()) return
    setEmailSending(true)
    setEmailResult(null)
    try {
      const doc = await buildCertificateDoc(emailModal.certData)
      const pdfBase64 = doc.output('datauristring').split(',')[1]
      const { certData, student } = emailModal
      const html = clearanceCertEmailHtml({
        schoolName: certData.school.name,
        parentName: student.parentName || 'Parent',
        studentName: student.name,
        studentClass: `${student.class} ${student.stream || ''}`.trim(),
        term: certData.school.term,
        feeRequired: certData.student.feeRequired,
        totalPaid: certData.student.totalPaid,
      })
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailInput.trim(),
          subject: `Fee Clearance Certificate — ${student.name} — ${certData.school.term}`,
          html,
          schoolName: certData.school.name,
          replyTo: certData.school.replyToEmail || undefined,
          pdfBase64,
          pdfFilename: student.name.replace(/\s+/g, '_') + '_clearance.pdf',
        }),
      })
      if (res.ok) {
        setEmailResult('sent')
        setSentEmails(prev => new Set([...prev, student.id]))
        if (emailInput.trim() !== student.parentEmail) {
          await fetch('/api/students', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: student.id, parentEmail: emailInput.trim() }),
          })
          setStudents(prev => prev.map(s => s.id === student.id ? { ...s, parentEmail: emailInput.trim() } : s))
        }
        setTimeout(() => { setEmailModal(null); setEmailResult(null) }, 2000)
      } else {
        setEmailResult('error')
      }
    } catch {
      setEmailResult('error')
    }
    setEmailSending(false)
  }

  async function saveEmail(studentId: number, email: string) {
    const cleaned = email.trim().toLowerCase()
    await fetch('/api/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, parentEmail: cleaned }),
    })
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, parentEmail: cleaned || null } : s))
    setEditingEmail(null)
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.admNo || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.class || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.parentEmail || '').toLowerCase().includes(search.toLowerCase())
  )

  function hasFeeBreakdown(s: any) {
    return s.tuitionFee > 0 || s.sportsFee > 0 || s.clubsFee > 0 || s.otherFee > 0
  }

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden'}}>
      <style>{`
        @media (max-width: 768px) {
          .stu-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .stu-header-actions { flex-wrap: wrap; width: 100%; }
          .stu-content { padding: 12px !important; }
          .stu-import-row { flex-direction: column !important; }
          .stu-search-row { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .stu-search-row input { width: 100% !important; box-sizing: border-box; }
          .stu-table-wrap td, .stu-table-wrap th { padding: 8px 10px !important; font-size: 11px !important; }
        }
      `}</style>

      <div className="stu-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px'}}>Students</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>{students.length} students enrolled</p>
        </div>
        <div className="stu-header-actions" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <Link href="/dashboard" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="stu-content" style={{padding: '24px 32px'}}>
        <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px'}}>
          <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Import students</h2>
          <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '4px'}}>
            CSV columns: name, admNo, class, stream, feeRequired, parentName, parentPhone, <strong>Parent Email</strong>
          </p>
          <p style={{fontSize: '11px', color: '#94a3b8', marginBottom: '16px'}}>
            Optional fee breakdown columns: <em>Tuition Fee, Sports Fee, Clubs Fee, Other Fee</em> — if provided, feeRequired is calculated as their sum.
          </p>
          {uploadError && (
            <div style={{background: '#fcebeb', border: '1px solid #f5c6c6', color: '#a32d2d', fontSize: '12px', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px'}}>
              {uploadError}
            </div>
          )}
          <div className="stu-import-row" style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{fontSize: '13px', color: '#64748b', flex: 1}}
              onChange={e => { setFile(e.target.files?.[0] || null); setUploadError('') }}
            />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                background: (!file || uploading) ? '#94a3b8' : '#c8a84b',
                color: (!file || uploading) ? '#fff' : '#0a1f4e', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                border: 'none', cursor: (!file || uploading) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap'
              }}
            >
              {uploading ? 'Uploading...' : 'Import'}
            </button>
          </div>
        </div>

        <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
          <div className="stu-search-row" style={{padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>
            <h2 style={{fontSize: '13px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap'}}>All students</h2>
            <input
              type="text"
              placeholder="Search by name, admission no, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', width: '260px', outline: 'none'}}
            />
          </div>

          {loading ? (
            <div style={{textAlign: 'center', color: '#94a3b8', padding: '48px'}}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{textAlign: 'center', color: '#94a3b8', padding: '48px', fontSize: '13px'}}>
              {students.length === 0 ? 'No students yet. Import a CSV to get started.' : 'No students match your search.'}
            </div>
          ) : (
            <div className="stu-table-wrap" style={{overflowX: 'auto', overflowY: 'auto', maxHeight: '660px', WebkitOverflowScrolling: 'touch' as any}}>
              <table style={{width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px', minWidth: '860px'}}>
                <thead style={{position: 'sticky', top: 0, zIndex: 1}}>
                  <tr style={{textAlign: 'left' as const, borderBottom: '1px solid #f1f5f9', background: '#fff'}}>
                    {['Name', 'Adm No', 'Class', 'Fee Required', 'Paid', 'Balance', 'Status', 'Parent Email', ''].map(h => (
                      <th key={h} style={{padding: '10px 14px', color: '#94a3b8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap', background: '#fff'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(student => {
                    const paid = student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
                    const balance = student.feeRequired - paid
                    const cleared = balance <= 0
                    const showFees = expandedFees === student.id
                    const isEditingEmail = editingEmail?.id === student.id
                    return (
                      <>
                        <tr key={student.id} style={{borderBottom: showFees ? 'none' : '1px solid #f8fafc', cursor: 'pointer'}} onClick={() => router.push('/students/' + student.id)}>
                          <td style={{padding: '10px 14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap'}}>
                            {student.name}
                            {hasFeeBreakdown(student) && (
                              <button
                                onClick={e => { e.stopPropagation(); setExpandedFees(showFees ? null : student.id) }}
                                style={{marginLeft: '6px', fontSize: '10px', color: '#c8a84b', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}
                              >
                                {showFees ? '▲ fees' : '▼ fees'}
                              </button>
                            )}
                          </td>
                          <td style={{padding: '10px 14px', color: '#64748b'}}>{student.admNo || '—'}</td>
                          <td style={{padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap'}}>{student.class} {student.stream}</td>
                          <td style={{padding: '10px 14px', whiteSpace: 'nowrap'}}>KES {student.feeRequired.toLocaleString()}</td>
                          <td style={{padding: '10px 14px', color: '#0a1f4e', fontWeight: 600, whiteSpace: 'nowrap'}}>KES {paid.toLocaleString()}</td>
                          <td style={{padding: '10px 14px', color: balance > 0 ? '#e24b4a' : '#64748b', fontWeight: balance > 0 ? 600 : 400, whiteSpace: 'nowrap'}}>
                            KES {balance.toLocaleString()}
                          </td>
                          <td style={{padding: '10px 14px'}}>
                            <span style={{
                              background: cleared ? '#e1f5ee' : paid > 0 ? '#fef9ec' : '#fcebeb',
                              color: cleared ? '#166534' : paid > 0 ? '#92681a' : '#a32d2d',
                              fontSize: '10px', padding: '3px 8px', borderRadius: '999px', fontWeight: 600, whiteSpace: 'nowrap'
                            }}>
                              {cleared ? 'Cleared' : paid > 0 ? 'Partial' : 'Unpaid'}
                            </span>
                          </td>
                          <td style={{padding: '10px 14px', minWidth: '180px'}} onClick={e => e.stopPropagation()}>
                            {isEditingEmail ? (
                              <input
                                type="email"
                                value={editingEmail!.value}
                                onChange={e => setEditingEmail({ id: student.id, value: e.target.value })}
                                onBlur={() => saveEmail(student.id, editingEmail!.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveEmail(student.id, editingEmail!.value)
                                  if (e.key === 'Escape') setEditingEmail(null)
                                }}
                                autoFocus
                                style={{border: '1px solid #c8a84b', borderRadius: '4px', padding: '3px 6px', fontSize: '12px', outline: 'none', width: '180px'}}
                              />
                            ) : (
                              <span
                                onClick={() => setEditingEmail({ id: student.id, value: student.parentEmail || '' })}
                                title={student.parentEmail ? 'Click to edit' : 'Click to add email'}
                                style={{cursor: 'text', color: student.parentEmail ? '#0a1f4e' : '#94a3b8', fontSize: '12px', display: 'block'}}
                              >
                                {student.parentEmail ? maskEmail(student.parentEmail) : '+ add email'}
                              </span>
                            )}
                          </td>
                          <td style={{padding: '10px 14px'}} onClick={e => e.stopPropagation()}>
                            {cleared && (
                              <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap' as const}}>
                                <button
                                  onClick={() => downloadCertificate(student.id, student.name)}
                                  style={{fontSize: '11px', color: '#c8a84b', background: 'none', border: '1px solid #c8a84b', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap'}}
                                >
                                  Certificate
                                </button>
                                <button
                                  onClick={() => openEmailModal(student)}
                                  style={{fontSize: '11px', color: sentEmails.has(student.id) ? '#0a7c3e' : '#0a1f4e', background: 'none', border: '1px solid ' + (sentEmails.has(student.id) ? '#0a7c3e' : '#0a1f4e'), padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap'}}
                                >
                                  {sentEmails.has(student.id) ? '✓ Sent' : 'Send via email'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {showFees && hasFeeBreakdown(student) && (
                          <tr key={student.id + '-fees'} style={{borderBottom: '1px solid #f8fafc', background: '#fafbfc'}}>
                            <td colSpan={9} style={{padding: '0 14px 12px 28px'}}>
                              <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap' as const}}>
                                {student.tuitionFee > 0 && <span style={{fontSize: '11px', color: '#64748b'}}>Tuition: <strong>KES {student.tuitionFee.toLocaleString()}</strong></span>}
                                {student.sportsFee > 0 && <span style={{fontSize: '11px', color: '#64748b'}}>Sports: <strong>KES {student.sportsFee.toLocaleString()}</strong></span>}
                                {student.clubsFee > 0 && <span style={{fontSize: '11px', color: '#64748b'}}>Clubs: <strong>KES {student.clubsFee.toLocaleString()}</strong></span>}
                                {student.otherFee > 0 && <span style={{fontSize: '11px', color: '#64748b'}}>Other: <strong>KES {student.otherFee.toLocaleString()}</strong></span>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {emailModal && (
        <div
          style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}
          onClick={e => { if (e.target === e.currentTarget) { setEmailModal(null); setEmailResult(null) } }}
        >
          <div style={{background: '#fff', borderRadius: '12px', padding: '28px', width: '400px', maxWidth: '92vw'}}>
            <h3 style={{fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Send certificate via email</h3>
            <p style={{fontSize: '12px', color: '#64748b', marginBottom: '20px'}}>{emailModal.student.name} · {emailModal.certData.school.term}</p>
            <label style={{fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px'}}>Parent email address</label>
            <input
              ref={emailInputRef}
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendCertificateEmail() }}
              placeholder="parent@example.com"
              style={{width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}}
            />
            {emailResult === 'sent' && (
              <p style={{fontSize: '12px', color: '#0a7c3e', marginTop: '12px', fontWeight: 600}}>Certificate sent successfully!</p>
            )}
            {emailResult === 'error' && (
              <p style={{fontSize: '12px', color: '#e24b4a', marginTop: '12px'}}>Failed to send. Check your email settings in the environment variables.</p>
            )}
            <div style={{display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => { setEmailModal(null); setEmailResult(null) }}
                style={{padding: '8px 16px', borderRadius: '6px', fontSize: '13px', background: 'none', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b'}}
              >
                Cancel
              </button>
              <button
                onClick={sendCertificateEmail}
                disabled={emailSending || !emailInput.trim()}
                style={{padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, background: emailSending || !emailInput.trim() ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', cursor: emailSending || !emailInput.trim() ? 'not-allowed' : 'pointer'}}
              >
                {emailSending ? 'Sending...' : 'Send certificate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
