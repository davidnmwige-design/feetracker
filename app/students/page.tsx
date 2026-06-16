'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { maskEmail } from '@/lib/mask'
import RoleGuard from '@/components/RoleGuard'

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
        <h1 style="margin:0;font-family:Georgia,serif;font-size:22px"><span style="color:#fff">Elimu</span><span style="color:#c8a84b"> Pay</span></h1>
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
        <p style="color:#94a3b8;font-size:11px;margin:0">Elimu Pay &middot; support@elimupay.co.ke</p>
      </div>
    </div>
  `
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

async function buildCertificateDoc(data: any) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const term = data.school?.term || data.school?.currentTerm || ''
  const schoolName = data.school?.name || ''
  const brandColorHex = data.school?.brandColor || '#c8a84b'
  const [br, bg, bb] = hexToRgb(brandColorHex)
  const schoolMotto = data.school?.schoolMotto || ''
  const logoUrl = data.school?.logoUrl || null

  // Double border
  doc.setDrawColor(10, 31, 78); doc.setLineWidth(1.5); doc.rect(8, 8, W - 16, 281)
  doc.setLineWidth(0.4); doc.rect(11, 11, W - 22, 275)

  // Navy header + brand colour rule
  doc.setFillColor(10, 31, 78); doc.rect(0, 0, W, 44, 'F')
  doc.setFillColor(br, bg, bb); doc.rect(0, 44, W, 2.5, 'F')

  // Watermark (drawn first so body text renders on top)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(88); doc.setTextColor(215, 222, 237)
  doc.text('CLEARED', W / 2, 178, { align: 'center', angle: 45 })

  if (logoUrl) {
    try { doc.addImage(logoUrl, 'PNG', W / 2 - 20, 4, 40, 18, undefined, 'FAST') } catch { /* fallback */ }
  }

  // School name in brand colour
  doc.setFont('helvetica', 'bold'); doc.setFontSize(logoUrl ? 14 : 20); doc.setTextColor(br, bg, bb)
  doc.text(schoolName.toUpperCase(), W / 2, logoUrl ? 26 : 17, { align: 'center' })
  if (schoolMotto) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(180, 195, 220)
    doc.text(schoolMotto, W / 2, 33, { align: 'center' })
  }
  // OFFICIAL DOCUMENT with letter-spacing
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(br, bg, bb)
  doc.setCharSpace(2.5); doc.text('OFFICIAL DOCUMENT', W / 2, schoolMotto ? 38 : 27, { align: 'center' }); doc.setCharSpace(0)
  // Term label
  doc.setFontSize(10); doc.setTextColor(170, 195, 225)
  doc.text(term, W / 2, 37, { align: 'center' })

  // Certificate title + brand colour underline
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(10, 31, 78)
  doc.text('FEE CLEARANCE CERTIFICATE', W / 2, 64, { align: 'center' })
  doc.setFillColor(br, bg, bb); doc.rect(38, 68, 134, 1, 'F')

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
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(br, bg, bb)
  doc.text('Generated by Elimu Pay · support@elimupay.co.ke', W / 2, 282, { align: 'center' })

  return doc
}

const CLASSES = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'PP1', 'PP2']

function getInitialCategories(student: any): {name: string; amount: number}[] {
  const cats = (student.feeCategories || []) as {name: string; amount: number}[]
  if (cats.length > 0) return cats.map(c => ({ name: c.name, amount: c.amount }))
  const legacy: {name: string; amount: number}[] = []
  if (student.tuitionFee > 0) legacy.push({ name: 'Tuition Fee', amount: student.tuitionFee })
  if (student.sportsFee > 0) legacy.push({ name: 'Sports Fee', amount: student.sportsFee })
  if (student.clubsFee > 0) legacy.push({ name: 'Clubs Fee', amount: student.clubsFee })
  if (student.otherFee > 0) legacy.push({ name: 'Other Fee', amount: student.otherFee })
  if (legacy.length === 0) legacy.push({ name: 'Tuition Fee', amount: student.feeRequired })
  return legacy
}

export default function Students() {
  useEffect(() => {
    fetch('/api/auth/check-2fa').then(r => r.json()).then(d => { if (!d.verified) window.location.href = '/verify-2fa' })
  }, [])
  const router = useRouter()
  const [students, setStudents] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [uploadError, setUploadError] = useState('')
  const [expandedFees, setExpandedFees] = useState<number | null>(null)
  const [editingEmail, setEditingEmail] = useState<{ id: number; value: string } | null>(null)
  const [emailModal, setEmailModal] = useState<{ student: any; certData: any } | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState<'sent' | 'error' | null>(null)
  const [sentEmails, setSentEmails] = useState<Set<number>>(new Set())

  // Inline fee editor
  const [feeEditId, setFeeEditId] = useState<number | null>(null)
  const [feeEditRows, setFeeEditRows] = useState<{name: string; amount: number}[]>([])
  const [feeEditSaving, setFeeEditSaving] = useState(false)

  // Add student modal
  const [addModal, setAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', admNo: '', studentClass: 'Form 1', stream: '', parentName: '', parentPhone: '', parentEmail: '', parent2Name: '', parent2Phone: '', parent2Email: '' })
  const [addCategories, setAddCategories] = useState([{ name: 'Tuition Fee', amount: 0 }])
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')

  // Bulk fee update modal
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkMode, setBulkMode] = useState<'update' | 'add'>('update')
  const [bulkClass, setBulkClass] = useState('All')
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkNewCategory, setBulkNewCategory] = useState('')
  const [bulkAmount, setBulkAmount] = useState(0)
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkResult, setBulkResult] = useState<string | null>(null)
  const [bulkSuccess, setBulkSuccess] = useState(false)

  const [downloading, setDownloading] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchStudents() }, [])

  // Debounce the search box (and reset to page 1) so filtering/rendering isn't run on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

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

  async function downloadReport() {
    setDownloading(true)
    try {
      const res = await fetch('/api/report')
      if (!res.ok) { setDownloading(false); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'fee_report.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
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

  // Inline fee editor handlers
  function openFeeEditor(student: any) {
    setFeeEditId(student.id)
    setFeeEditRows(getInitialCategories(student))
    setExpandedFees(null)
  }

  function closeFeeEditor() {
    setFeeEditId(null)
    setFeeEditRows([])
  }

  async function saveFeeEdits(studentId: number) {
    if (feeEditSaving) return
    setFeeEditSaving(true)
    const res = await fetch('/api/fee-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, categories: feeEditRows }),
    })
    const data = await res.json()
    if (res.ok) {
      setStudents(prev => prev.map(s => s.id === studentId
        ? { ...s, feeRequired: data.total, feeCategories: data.categories }
        : s
      ))
      closeFeeEditor()
    }
    setFeeEditSaving(false)
  }

  // Add student handlers
  function openAddModal() {
    setAddForm({ name: '', admNo: '', studentClass: 'Form 1', stream: '', parentName: '', parentPhone: '', parentEmail: '', parent2Name: '', parent2Phone: '', parent2Email: '' })
    setAddCategories([{ name: 'Tuition Fee', amount: 0 }])
    setAddError('')
    setAddModal(true)
  }

  async function saveNewStudent() {
    if (addSaving) return
    if (!addForm.name.trim() || !addForm.admNo.trim()) {
      setAddError('Name and admission number are required')
      return
    }
    setAddSaving(true)
    setAddError('')
    const res = await fetch('/api/students/single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm, categories: addCategories }),
    })
    const data = await res.json()
    if (!res.ok) {
      setAddError(data.error || 'Failed to add student')
      setAddSaving(false)
      return
    }
    setStudents(prev => [data, ...prev])
    setAddModal(false)
    setAddSaving(false)
  }

  // Bulk update handlers
  function openBulkModal() {
    const fromCats = students.flatMap(s => (s.feeCategories || []).map((c: any) => c.name))
    const fromLegacy = students.flatMap(s => {
      const l: string[] = []
      if (s.tuitionFee > 0) l.push('Tuition Fee')
      if (s.sportsFee > 0) l.push('Sports Fee')
      if (s.clubsFee > 0) l.push('Clubs Fee')
      if (s.otherFee > 0) l.push('Other Fee')
      return l
    })
    const names = [...new Set([...fromCats, ...fromLegacy])] as string[]
    setBulkMode('update')
    setBulkCategory(names[0] || '')
    setBulkNewCategory('')
    setBulkClass('All')
    setBulkAmount(0)
    setBulkResult(null)
    setBulkSuccess(false)
    setBulkModal(true)
  }

  async function runBulkUpdate() {
    if (bulkSaving) return
    const categoryName = bulkMode === 'update' ? bulkCategory.trim() : bulkNewCategory.trim()
    if (!categoryName) {
      setBulkResult(bulkMode === 'update' ? 'Please select a fee category' : 'Please enter a category name')
      setBulkSuccess(false)
      return
    }
    if (bulkAmount <= 0) {
      setBulkResult('Please enter an amount greater than 0')
      setBulkSuccess(false)
      return
    }
    setBulkSaving(true)
    setBulkResult(null)
    setBulkSuccess(false)
    try {
      const payload = {
        mode: bulkMode,
        className: bulkClass,
        categoryName,
        newAmount: bulkAmount,
      }
      const res = await fetch('/api/fee-categories/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        setBulkResult(data.message || `Done — ${data.updated} student${data.updated !== 1 ? 's' : ''} updated`)
        setBulkSuccess(true)
        await fetchStudents()
        setTimeout(() => {
          setBulkModal(false)
          setBulkResult(null)
          setBulkSuccess(false)
        }, 2400)
      } else {
        setBulkResult(data.error || 'Update failed — please try again')
        setBulkSuccess(false)
      }
    } catch {
      setBulkResult('Network error — please try again')
      setBulkSuccess(false)
    }
    setBulkSaving(false)
  }

  const allCategoryNames = [...new Set([
    ...students.flatMap(s => (s.feeCategories || []).map((c: any) => c.name)),
    ...students.flatMap(s => {
      const l: string[] = []
      if (s.tuitionFee > 0) l.push('Tuition Fee')
      if (s.sportsFee > 0) l.push('Sports Fee')
      if (s.clubsFee > 0) l.push('Clubs Fee')
      if (s.otherFee > 0) l.push('Other Fee')
      return l
    }),
  ])] as string[]

  const uniqueClasses = [...new Set(students.map(s => s.class).filter(Boolean))].sort() as string[]

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (s.admNo || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (s.class || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (s.parentEmail || '').toLowerCase().includes(debouncedSearch.toLowerCase())
  )
  // Render only one page of rows at a time — avoids building tens of thousands of DOM nodes.
  const PAGE_SIZE = 50
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function hasFeeBreakdown(s: any) {
    return s.tuitionFee > 0 || s.sportsFee > 0 || s.clubsFee > 0 || s.otherFee > 0
  }

  return (
    <RoleGuard requiredPermission="canManageStudents">
    <main style={{background: 'var(--ep-bg-secondary)', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden', maxWidth: '100vw'}}>
      <style>{`
        @media (max-width: 640px) {
          .stu-header { flex-direction: column !important; gap: 14px !important; padding: 16px !important; }
          .stu-header-actions { flex-direction: column !important; width: 100% !important; }
          .stu-header-actions button, .stu-header-actions a { width: 100% !important; text-align: center !important; box-sizing: border-box !important; display: block !important; }
          .stu-content { padding: 12px !important; }
          .stu-import-row { flex-direction: column !important; }
          .stu-search-row { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
          .stu-search-row input { width: 100% !important; box-sizing: border-box !important; }
        }
      `}</style>

      <div className="stu-header" style={{background: '#0a1f4e', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px'}}>
        <div style={{flexShrink: 0}}>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px', margin: 0}}>Students</h1>
          <p style={{fontSize: '12px', color: '#94a3c8', margin: '4px 0 0'}}>{students.length} enrolled</p>
        </div>
        <div className="stu-header-actions" style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const, justifyContent: 'flex-end'}}>
          <button onClick={openAddModal} style={{background: '#c8a84b', color: 'var(--ep-text-primary)', border: 'none', padding: '8px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'}}>
            + Add student
          </button>
          <button onClick={openBulkModal} style={{background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '8px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'}}>
            Bulk update fees
          </button>
          <button onClick={downloadReport} disabled={downloading} style={{background: 'none', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 14px', borderRadius: '5px', fontSize: '12px', cursor: downloading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: downloading ? 0.6 : 1}}>
            {downloading ? 'Downloading…' : 'Download report'}
          </button>
          <Link href="/dashboard" style={{border: '1px solid rgba(255,255,255,0.15)', color: '#94a3c8', padding: '8px 14px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap'}}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="stu-content" style={{padding: '24px 32px'}}>
        <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)', padding: '20px', marginBottom: '16px'}}>
          <h2 style={{fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Import students</h2>
          <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', marginBottom: '4px'}}>
            CSV columns: name, admNo, class, stream, feeRequired, parentName, parentPhone, <strong>Parent Email</strong>
          </p>
          <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', marginBottom: '16px'}}>
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
              style={{fontSize: '13px', color: 'var(--ep-text-secondary)', flex: 1}}
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

        <div style={{background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)'}}>
          <div className="stu-search-row" style={{padding: '14px 16px', borderBottom: '1px solid var(--ep-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'}}>
            <h2 style={{fontSize: '13px', fontWeight: 700, color: 'var(--ep-text-primary)', whiteSpace: 'nowrap'}}>All students</h2>
            <input
              type="text"
              placeholder="Search by name, admission no, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', width: '260px', outline: 'none'}}
            />
          </div>

          {loading ? (
            <div style={{textAlign: 'center', color: 'var(--ep-text-tertiary)', padding: '48px'}}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{textAlign: 'center', color: 'var(--ep-text-tertiary)', padding: '48px', fontSize: '13px'}}>
              {students.length === 0 ? 'No students yet. Import a CSV to get started.' : 'No students match your search.'}
            </div>
          ) : (
            <>
            <div className="stu-table-wrap" style={{overflowX: 'auto', overflowY: 'auto', maxHeight: '640px', WebkitOverflowScrolling: 'touch' as any, width: '100%'}}>
              <table style={{width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px', minWidth: '900px', tableLayout: 'fixed' as const}}>
                <thead style={{position: 'sticky', top: 0, zIndex: 1}}>
                  <tr style={{textAlign: 'left' as const, borderBottom: '1px solid var(--ep-border)', background: 'var(--ep-table-header, var(--ep-bg-tertiary))'}}>
                    {[
                      {h: 'Name', w: '160px'}, {h: 'Adm No', w: '80px'}, {h: 'Class', w: '80px'},
                      {h: 'Fee Required', w: '100px'}, {h: '', w: '36px'},
                      {h: 'Paid', w: '90px'}, {h: 'Balance', w: '90px'}, {h: 'Status', w: '72px'},
                      {h: 'Parent Email', w: '160px'}, {h: '', w: '140px'},
                    ].map(({h, w}, i) => (
                      <th key={i} style={{padding: '10px 10px', color: 'var(--ep-text-secondary)', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap', background: 'var(--ep-table-header, var(--ep-bg-tertiary))', width: w}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(student => {
                    const paid = student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
                    const balance = (student.effectiveFee ?? student.feeRequired) - paid
                    const cleared = balance <= 0
                    const isEditingEmail = editingEmail?.id === student.id
                    const isFeeEdit = feeEditId === student.id
                    const feeTotal = feeEditRows.reduce((s, r) => s + (Number(r.amount) || 0), 0)

                    return (
                      <>
                        <tr key={student.id} style={{borderBottom: isFeeEdit ? 'none' : '1px solid var(--ep-border)', cursor: 'pointer', background: isFeeEdit ? 'var(--ep-bg-tertiary)' : undefined}} onClick={() => router.push('/students/' + student.id)}>
                          <td style={{padding: '9px 10px', fontWeight: 600, color: 'var(--ep-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{student.name}</td>
                          <td style={{padding: '9px 10px', color: 'var(--ep-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis'}}>{student.admNo || '—'}</td>
                          <td style={{padding: '9px 10px', color: 'var(--ep-text-secondary)', whiteSpace: 'nowrap'}}>{student.class}{student.stream ? ' ' + student.stream : ''}</td>
                          <td style={{padding: '9px 10px', whiteSpace: 'nowrap'}}>KES {student.feeRequired.toLocaleString()}</td>
                          {/* Pencil edit button */}
                          <td style={{padding: '4px 4px', textAlign: 'center'}} onClick={e => e.stopPropagation()}>
                            <button onClick={() => isFeeEdit ? closeFeeEditor() : openFeeEditor(student)} title="Edit fee categories"
                              style={{background: isFeeEdit ? '#c8a84b' : 'none', border: isFeeEdit ? 'none' : '1px solid var(--ep-border)', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', fontSize: '12px', color: isFeeEdit ? '#0a1f4e' : 'var(--ep-text-tertiary)', fontWeight: isFeeEdit ? 700 : 400, lineHeight: 1}}>
                              Edit
                            </button>
                          </td>
                          <td style={{padding: '9px 10px', color: 'var(--ep-text-primary)', fontWeight: 600, whiteSpace: 'nowrap'}}>KES {paid.toLocaleString()}</td>
                          <td style={{padding: '9px 10px', color: balance > 0 ? '#e24b4a' : 'var(--ep-text-secondary)', fontWeight: balance > 0 ? 600 : 400, whiteSpace: 'nowrap'}}>KES {balance.toLocaleString()}</td>
                          <td style={{padding: '9px 10px'}}>
                            <span style={{background: cleared ? '#e1f5ee' : paid > 0 ? '#fef9ec' : '#fcebeb', color: cleared ? '#166534' : paid > 0 ? '#92681a' : '#a32d2d', fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block'}}>
                              {cleared ? 'Cleared' : paid > 0 ? 'Partial' : 'Unpaid'}
                            </span>
                          </td>
                          <td style={{padding: '9px 10px'}} onClick={e => e.stopPropagation()}>
                            {isEditingEmail ? (
                              <input type="email" maxLength={254} value={editingEmail!.value}
                                onChange={e => setEditingEmail({ id: student.id, value: e.target.value })}
                                onBlur={() => saveEmail(student.id, editingEmail!.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveEmail(student.id, editingEmail!.value); if (e.key === 'Escape') setEditingEmail(null) }}
                                autoFocus
                                style={{border: '1px solid #c8a84b', borderRadius: '4px', padding: '3px 6px', fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box' as const}}
                              />
                            ) : (
                              <span onClick={() => setEditingEmail({ id: student.id, value: student.parentEmail || '' })}
                                title={student.parentEmail ? 'Click to edit' : 'Click to add email'}
                                style={{cursor: 'text', color: student.parentEmail ? 'var(--ep-text-primary)' : 'var(--ep-text-tertiary)', fontSize: '12px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                {student.parentEmail ? maskEmail(student.parentEmail) : '+ add email'}
                              </span>
                            )}
                          </td>
                          <td style={{padding: '9px 10px'}} onClick={e => e.stopPropagation()}>
                            {cleared && (
                              <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap' as const}}>
                                <button onClick={() => downloadCertificate(student.id, student.name)}
                                  style={{fontSize: '11px', color: '#c8a84b', background: 'none', border: '1px solid #c8a84b', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap'}}>
                                  Certificate
                                </button>
                                <button onClick={() => openEmailModal(student)}
                                  style={{fontSize: '11px', color: sentEmails.has(student.id) ? '#0a7c3e' : '#0a1f4e', background: 'none', border: '1px solid ' + (sentEmails.has(student.id) ? '#0a7c3e' : '#0a1f4e'), padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap'}}>
                                  {sentEmails.has(student.id) ? 'Sent' : 'Send via email'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Inline fee editor accordion */}
                        {isFeeEdit && (
                          <tr key={student.id + '-feeedit'}>
                            <td colSpan={10} style={{padding: 0, background: 'var(--ep-bg-tertiary)', borderBottom: '2px solid #c8a84b', overflow: 'hidden'}}>
                              <div style={{padding: '16px 20px'}}>
                                <p style={{fontSize: '12px', fontWeight: 700, color: '#c8a84b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                                  Edit fee categories — {student.name}
                                </p>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px'}}>
                                  {feeEditRows.map((row, i) => (
                                    <div key={i} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                      <input
                                        value={row.name}
                                        maxLength={80}
                                        onChange={e => setFeeEditRows(prev => prev.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                                        placeholder="Category name"
                                        style={{flex: 2, border: '1px solid var(--ep-border)', borderRadius: '5px', padding: '6px 10px', fontSize: '13px', outline: 'none', background: 'var(--ep-card-bg)', minWidth: '100px'}}
                                      />
                                      <input
                                        type="number"
                                        value={row.amount}
                                        onChange={e => setFeeEditRows(prev => prev.map((r, j) => j === i ? { ...r, amount: Number(e.target.value) } : r))}
                                        placeholder="0"
                                        min="0"
                                        max="10000000"
                                        style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '5px', padding: '6px 10px', fontSize: '13px', outline: 'none', background: 'var(--ep-card-bg)', minWidth: '80px'}}
                                      />
                                      <button onClick={() => setFeeEditRows(prev => prev.filter((_, j) => j !== i))}
                                        style={{background: 'none', border: 'none', color: '#e24b4a', cursor: 'pointer', fontSize: '14px', padding: '0 4px', flexShrink: 0}}>
                                        x
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const}}>
                                  <button onClick={() => setFeeEditRows(prev => [...prev, { name: '', amount: 0 }])}
                                    style={{fontSize: '12px', background: 'none', border: '1px dashed #c8a84b', color: 'var(--ep-text-secondary)', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer'}}>
                                    + Add category
                                  </button>
                                  <span style={{fontSize: '12px', color: '#c8a84b', fontWeight: 700}}>
                                    Total: KES {feeTotal.toLocaleString()}
                                  </span>
                                  <button onClick={() => saveFeeEdits(student.id)} disabled={feeEditSaving}
                                    style={{background: feeEditSaving ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, cursor: feeEditSaving ? 'not-allowed' : 'pointer'}}>
                                    {feeEditSaving ? 'Saving…' : 'Save fees'}
                                  </button>
                                  <button onClick={closeFeeEditor}
                                    style={{background: 'none', border: '1px solid var(--ep-border)', color: 'var(--ep-text-secondary)', padding: '6px 12px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer'}}>
                                    Cancel
                                  </button>
                                </div>
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
            {filtered.length > PAGE_SIZE && (
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--ep-border)', fontSize: '12px', color: 'var(--ep-text-secondary)', flexWrap: 'wrap' as const, gap: '8px'}}>
                <span>Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1} style={{padding: '5px 12px', borderRadius: '5px', border: '1px solid var(--ep-border)', background: 'var(--ep-card-bg)', color: 'var(--ep-text-secondary)', cursor: safePage <= 1 ? 'not-allowed' : 'pointer', opacity: safePage <= 1 ? 0.5 : 1}}>Prev</button>
                  <span>Page {safePage} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} style={{padding: '5px 12px', borderRadius: '5px', border: '1px solid var(--ep-border)', background: 'var(--ep-card-bg)', color: 'var(--ep-text-secondary)', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages ? 0.5 : 1}}>Next</button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {addModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'}}
          onClick={e => { if (e.target === e.currentTarget && !addSaving) setAddModal(false) }}>
          <div style={{background: 'var(--ep-card-bg)', borderRadius: '12px', width: '520px', maxWidth: '100%', maxHeight: '90vh', overflow: 'auto'}}>
            <div style={{padding: '20px 24px', borderBottom: '1px solid var(--ep-border)'}}>
              <h3 style={{fontSize: '16px', fontWeight: 700, color: 'var(--ep-text-primary)', margin: 0}}>Add student</h3>
            </div>
            <div style={{padding: '20px 24px'}}>
              {addError && <div style={{background: '#fcebeb', border: '1px solid #f5c6c6', color: '#a32d2d', fontSize: '12px', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px'}}>{addError}</div>}

              <p style={{fontSize: '11px', fontWeight: 700, color: 'var(--ep-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px'}}>Student details</p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px'}}>
                {[{label:'Name *', key:'name', type:'text', placeholder:'e.g. John Kamau', max:120},
                  {label:'Admission No. *', key:'admNo', type:'text', placeholder:'e.g. ADM001', max:20},
                  {label:'Stream', key:'stream', type:'text', placeholder:'e.g. North', max:20},
                ].map(f => (
                  <div key={f.key}>
                    <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '4px'}}>{f.label}</label>
                    <input type={f.type} maxLength={f.max} value={(addForm as any)[f.key]} onChange={e => setAddForm(p => ({...p, [f.key]: e.target.value}))}
                      placeholder={f.placeholder}
                      style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}} />
                  </div>
                ))}
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '4px'}}>Class *</label>
                  <select value={addForm.studentClass} onChange={e => setAddForm(p => ({...p, studentClass: e.target.value}))}
                    style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none', background: 'var(--ep-card-bg)', boxSizing: 'border-box' as const}}>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <p style={{fontSize: '11px', fontWeight: 700, color: 'var(--ep-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px'}}>Parent 1</p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px'}}>
                {[{label:'Name *', key:'parentName', placeholder:'e.g. Jane Kamau', max:120},
                  {label:'Phone *', key:'parentPhone', placeholder:'e.g. 0712345678', max:20},
                  {label:'Email', key:'parentEmail', placeholder:'parent@email.com', max:254},
                ].map(f => (
                  <div key={f.key}>
                    <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '4px'}}>{f.label}</label>
                    <input type="text" maxLength={f.max} value={(addForm as any)[f.key]} onChange={e => setAddForm(p => ({...p, [f.key]: e.target.value}))}
                      placeholder={f.placeholder}
                      style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}} />
                  </div>
                ))}
              </div>

              <p style={{fontSize: '11px', fontWeight: 700, color: 'var(--ep-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px'}}>Parent 2 (optional)</p>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px'}}>
                {[{label:'Name', key:'parent2Name', placeholder:'', max:120},
                  {label:'Phone', key:'parent2Phone', placeholder:'', max:20},
                  {label:'Email', key:'parent2Email', placeholder:'', max:254},
                ].map(f => (
                  <div key={f.key}>
                    <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '4px'}}>{f.label}</label>
                    <input type="text" maxLength={f.max} value={(addForm as any)[f.key]} onChange={e => setAddForm(p => ({...p, [f.key]: e.target.value}))}
                      style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}} />
                  </div>
                ))}
              </div>

              <p style={{fontSize: '11px', fontWeight: 700, color: 'var(--ep-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px'}}>Fee categories</p>
              <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px'}}>
                {addCategories.map((cat, i) => (
                  <div key={i} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <input value={cat.name} maxLength={80} onChange={e => setAddCategories(p => p.map((c, j) => j === i ? {...c, name: e.target.value} : c))}
                      placeholder="Category name"
                      style={{flex: 2, border: '1px solid var(--ep-border)', borderRadius: '5px', padding: '6px 10px', fontSize: '13px', outline: 'none'}} />
                    <input type="number" value={cat.amount} min="0" max="10000000"
                      onChange={e => setAddCategories(p => p.map((c, j) => j === i ? {...c, amount: Number(e.target.value)} : c))}
                      placeholder="0"
                      style={{flex: 1, border: '1px solid var(--ep-border)', borderRadius: '5px', padding: '6px 10px', fontSize: '13px', outline: 'none', minWidth: '80px'}} />
                    {addCategories.length > 1 && (
                      <button onClick={() => setAddCategories(p => p.filter((_, j) => j !== i))}
                        style={{background: 'none', border: 'none', color: '#e24b4a', cursor: 'pointer', fontSize: '14px', padding: '0 4px'}}>x</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <button onClick={() => setAddCategories(p => [...p, {name: '', amount: 0}])}
                  style={{fontSize: '12px', background: 'none', border: '1px dashed #c8a84b', color: 'var(--ep-text-secondary)', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer'}}>
                  + Add category
                </button>
                <span style={{fontSize: '12px', color: 'var(--ep-text-primary)', fontWeight: 700}}>
                  Total: KES {addCategories.reduce((s, c) => s + (Number(c.amount) || 0), 0).toLocaleString()}
                </span>
              </div>

              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button onClick={() => setAddModal(false)} disabled={addSaving}
                  style={{padding: '9px 20px', borderRadius: '6px', fontSize: '13px', background: 'none', border: '1px solid var(--ep-border)', cursor: 'pointer', color: 'var(--ep-text-secondary)'}}>
                  Cancel
                </button>
                <button onClick={saveNewStudent} disabled={addSaving}
                  style={{padding: '9px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, background: addSaving ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', cursor: addSaving ? 'not-allowed' : 'pointer'}}>
                  {addSaving ? 'Saving…' : 'Add student'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Fee Update Modal */}
      {bulkModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'}}
          onClick={e => { if (e.target === e.currentTarget && !bulkSaving) { setBulkModal(false); setBulkResult(null); setBulkSuccess(false) } }}>
          <div style={{background: 'var(--ep-card-bg)', borderRadius: '12px', padding: '28px', width: '480px', maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px'}}>
              <h3 style={{fontSize: '16px', fontWeight: 700, color: 'var(--ep-text-primary)', margin: 0}}>Bulk fee update</h3>
              {!bulkSaving && (
                <button onClick={() => { setBulkModal(false); setBulkResult(null); setBulkSuccess(false) }}
                  style={{background: 'none', border: 'none', color: 'var(--ep-text-tertiary)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px'}}>x</button>
              )}
            </div>

            {/* Mode tabs */}
            <div style={{display: 'flex', border: '1px solid var(--ep-border)', borderRadius: '8px', padding: '3px', marginBottom: '20px', background: 'var(--ep-bg-secondary)'}}>
              {(['update', 'add'] as const).map(m => (
                <button key={m} onClick={() => { if (!bulkSaving) { setBulkMode(m); setBulkResult(null); setBulkSuccess(false) } }}
                  style={{flex: 1, padding: '8px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: bulkSaving ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                    background: bulkMode === m ? 'var(--ep-bg-tertiary)' : 'transparent',
                    color: bulkMode === m ? 'var(--ep-text-primary)' : 'var(--ep-text-secondary)',
                    boxShadow: bulkMode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}>
                  {m === 'update' ? 'Update existing' : 'Add new category'}
                </button>
              ))}
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px'}}>
              {/* Class selector */}
              <div>
                <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>
                  {bulkMode === 'update' ? 'Class to update' : 'Class to add to'}
                </label>
                <select value={bulkClass} onChange={e => setBulkClass(e.target.value)}
                  style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', outline: 'none', background: 'var(--ep-card-bg)'}}>
                  <option value="All">All classes ({students.length} students)</option>
                  {uniqueClasses.map(c => {
                    const count = students.filter(s => s.class === c).length
                    return <option key={c} value={c}>{c} ({count} student{count !== 1 ? 's' : ''})</option>
                  })}
                </select>
              </div>

              {/* Mode 1: pick from existing categories */}
              {bulkMode === 'update' && (
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>Fee category</label>
                  {allCategoryNames.length > 0 ? (
                    <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)}
                      style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', outline: 'none', background: 'var(--ep-card-bg)'}}>
                      {allCategoryNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  ) : (
                    <p style={{fontSize: '12px', color: 'var(--ep-text-tertiary)', margin: 0}}>No fee categories found. Use "Add new category" to create one.</p>
                  )}
                </div>
              )}

              {/* Mode 2: type a new category name */}
              {bulkMode === 'add' && (
                <div>
                  <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>New category name</label>
                  <p style={{fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '0 0 6px'}}>e.g. Swimming, Music, Transport, Boarding</p>
                  <input type="text" value={bulkNewCategory} onChange={e => setBulkNewCategory(e.target.value)}
                    placeholder="Category name"
                    style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}} />
                </div>
              )}

              {/* Amount */}
              <div>
                <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px'}}>Amount (KES)</label>
                <input type="number" value={bulkAmount === 0 ? '' : bulkAmount} min="0"
                  onChange={e => setBulkAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="e.g. 45000"
                  style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}} />
              </div>
            </div>

            {/* Preview */}
            {!bulkResult && !bulkSaving && bulkAmount > 0 && (bulkMode === 'update' ? bulkCategory.trim() : bulkNewCategory.trim()) && (() => {
              const catName = bulkMode === 'update' ? bulkCategory : bulkNewCategory
              const classCount = bulkClass === 'All' ? students.length : students.filter(s => s.class === bulkClass).length
              const classDesc = bulkClass === 'All' ? `all ${classCount}` : `${classCount}`
              const classLabel = bulkClass === 'All' ? '' : ` in ${bulkClass}`
              return (
                <div style={{background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#1e40af'}}>
                  {bulkMode === 'update'
                    ? <>Will set <strong>{catName}</strong> to <strong>KES {bulkAmount.toLocaleString()}</strong> for up to <strong>{classDesc} student{classCount !== 1 ? 's' : ''}</strong>{classLabel} who already have this category.</>
                    : <>Will add <strong>{catName}</strong> (KES {bulkAmount.toLocaleString()}) to <strong>{classDesc} student{classCount !== 1 ? 's' : ''}</strong>{classLabel} who don&apos;t have it yet.</>
                  }
                </div>
              )
            })()}

            {/* Loading */}
            {bulkSaving && (
              <div style={{background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{width: '18px', height: '18px', border: '2px solid #bfdbfe', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0}} />
                <span style={{fontSize: '13px', color: '#1e40af', fontWeight: 600}}>
                  {bulkMode === 'update' ? 'Updating students…' : 'Adding category to students…'}
                </span>
              </div>
            )}

            {/* Result */}
            {bulkResult && (
              <div style={{background: bulkSuccess ? '#e1f5ee' : '#fcebeb', border: `1px solid ${bulkSuccess ? '#bbf7d0' : '#fecaca'}`, borderRadius: '6px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: bulkSuccess ? '#166534' : '#a32d2d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{fontSize: '16px'}}>{bulkSuccess ? 'Done' : 'Error'}</span>
                {bulkResult}
              </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button onClick={() => { setBulkModal(false); setBulkResult(null); setBulkSuccess(false) }} disabled={bulkSaving}
                style={{padding: '9px 20px', borderRadius: '6px', fontSize: '13px', background: 'none', border: '1px solid var(--ep-border)', cursor: bulkSaving ? 'not-allowed' : 'pointer', color: 'var(--ep-text-secondary)', opacity: bulkSaving ? 0.5 : 1}}>
                {bulkSuccess ? 'Close' : 'Cancel'}
              </button>
              {!bulkSuccess && (
                <button onClick={runBulkUpdate}
                  disabled={bulkSaving || (bulkMode === 'update' ? !bulkCategory.trim() : !bulkNewCategory.trim()) || bulkAmount <= 0}
                  style={{padding: '9px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                    background: (bulkSaving || (bulkMode === 'update' ? !bulkCategory.trim() : !bulkNewCategory.trim()) || bulkAmount <= 0) ? '#94a3b8' : '#c8a84b',
                    color: (bulkSaving || (bulkMode === 'update' ? !bulkCategory.trim() : !bulkNewCategory.trim()) || bulkAmount <= 0) ? '#fff' : '#0a1f4e',
                    border: 'none', cursor: (bulkSaving || (bulkMode === 'update' ? !bulkCategory.trim() : !bulkNewCategory.trim()) || bulkAmount <= 0) ? 'not-allowed' : 'pointer',
                  }}>
                  {bulkSaving ? (bulkMode === 'update' ? 'Updating…' : 'Adding…') : bulkResult ? 'Try again' : (bulkMode === 'update' ? 'Update all' : 'Add to all students')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {emailModal && (
        <div
          style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}
          onClick={e => { if (e.target === e.currentTarget) { setEmailModal(null); setEmailResult(null) } }}
        >
          <div style={{background: 'var(--ep-card-bg)', borderRadius: '12px', padding: '28px', width: '400px', maxWidth: '92vw'}}>
            <h3 style={{fontSize: '15px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px'}}>Send certificate via email</h3>
            <p style={{fontSize: '12px', color: 'var(--ep-text-secondary)', marginBottom: '20px'}}>{emailModal.student.name} · {emailModal.certData.school.term}</p>
            <label style={{fontSize: '12px', color: 'var(--ep-text-secondary)', display: 'block', marginBottom: '6px'}}>Parent email address</label>
            <input
              ref={emailInputRef}
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendCertificateEmail() }}
              placeholder="parent@example.com"
              style={{width: '100%', border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const}}
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
                style={{padding: '8px 16px', borderRadius: '6px', fontSize: '13px', background: 'none', border: '1px solid var(--ep-border)', cursor: 'pointer', color: 'var(--ep-text-secondary)'}}
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
    </main>
    </RoleGuard>
  )
}
