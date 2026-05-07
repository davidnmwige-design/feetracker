'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function reminderEmailHtml({
  schoolName,
  parentName,
  studentName,
  studentClass,
  balance,
  paybill,
  accountNumberFormat,
}: {
  schoolName: string
  parentName: string
  studentName: string
  studentClass: string
  balance: number
  paybill?: string | null
  accountNumberFormat?: string | null
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#0a1f4e;padding:24px;text-align:center">
        <h1 style="color:#c8a84b;margin:0;font-family:Georgia,serif;font-size:22px">FeeTracker</h1>
        <p style="color:#94a3c8;margin:6px 0 0;font-size:12px">${schoolName}</p>
      </div>
      <div style="padding:32px;background:#fff;border:1px solid #e2e8f0">
        <h2 style="color:#0f172a;font-size:18px;margin-bottom:8px">Fee Payment Reminder</h2>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:20px">
          Dear ${parentName},<br>this is a reminder regarding the outstanding fee balance for ${studentName}.
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
              <td style="padding:8px 0;color:#64748b;font-size:13px">Outstanding Balance</td>
              <td style="text-align:right;font-weight:700;color:#e24b4a;font-size:15px">KES ${balance.toLocaleString()}</td>
            </tr>
          </table>
        </div>
        <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0">
          Please make payment at your earliest convenience. Thank you.
        </p>
        ${paybill ? `
        <div style="background:#0a1f4e;border-radius:8px;padding:16px 20px;margin-top:20px">
          <p style="color:#c8a84b;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 10px">How to Pay</p>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:#94a3c8;font-size:12px;padding:4px 0">MPESA Paybill</td>
              <td style="text-align:right;font-weight:700;color:#c8a84b;font-size:15px">${paybill}</td>
            </tr>
            ${accountNumberFormat ? `<tr><td style="color:#94a3c8;font-size:12px;padding:4px 0">Account Number</td><td style="text-align:right;color:#fff;font-size:12px">${accountNumberFormat}</td></tr>` : ''}
            <tr>
              <td style="color:#94a3c8;font-size:12px;padding:4px 0">Amount Due</td>
              <td style="text-align:right;font-weight:700;color:#fff;font-size:13px">KES ${balance.toLocaleString()}</td>
            </tr>
          </table>
        </div>` : ''}
      </div>
      <div style="padding:16px;background:#f8f9fc;text-align:center">
        <p style="color:#94a3b8;font-size:11px;margin:0">FeeTracker &middot; support@feetracker.co.ke</p>
      </div>
    </div>
  `
}

export default function Reminders() {
  const [students, setStudents] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<number | null>(null)

  // Per-card email form
  const [emailFormId, setEmailFormId] = useState<number | null>(null)
  const [emailFormValue, setEmailFormValue] = useState('')
  const [emailSendingId, setEmailSendingId] = useState<number | null>(null)
  const [emailSentIds, setEmailSentIds] = useState<Set<number>>(new Set())
  const [emailFormError, setEmailFormError] = useState('')
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Bulk email modal
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkEmails, setBulkEmails] = useState<Record<number, string>>({})
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ sent: number; skipped: number } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/students').then(r => r.json()),
      fetch('/api/school').then(r => r.json()),
    ]).then(([studentsData, schoolData]) => {
      setStudents(studentsData)
      setSchool(schoolData)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (emailFormId !== null) setTimeout(() => emailInputRef.current?.focus(), 50)
  }, [emailFormId])

  function getPaid(student: any) {
    return student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
  }

  function getBalance(student: any) {
    return student.feeRequired - getPaid(student)
  }

  function getMessage(student: any) {
    const balance = getBalance(student)
    const name = student.parentName || 'Parent'
    const cls = student.class + ' ' + student.stream
    let msg = 'Dear ' + name + ', this is a reminder that ' + student.name + ' (' + cls + ') has an outstanding fee balance of KES ' + balance.toLocaleString() + ' for this term. Please make payment at your earliest convenience. Thank you. - ' + (school?.name || 'FeeTracker')
    if (school?.paybill) {
      const acctFmt = school.accountNumberFormat ? ' | Account No: ' + school.accountNumberFormat : ''
      msg += '\nTo pay: MPESA Paybill ' + school.paybill + acctFmt + ' | Balance: KES ' + balance.toLocaleString()
    }
    return msg
  }

  function copyMessage(id: number, msg: string) {
    navigator.clipboard.writeText(msg)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function openEmailForm(student: any) {
    setEmailFormId(student.id)
    setEmailFormValue(student.parentEmail || '')
    setEmailFormError('')
  }

  async function sendReminderEmail(student: any, toEmail: string) {
    if (!toEmail.trim()) return
    setEmailSendingId(student.id)
    setEmailFormError('')
    try {
      const schoolName = school?.name || 'Your School'
      const html = reminderEmailHtml({
        schoolName,
        parentName: student.parentName || 'Parent',
        studentName: student.name,
        studentClass: `${student.class} ${student.stream || ''}`.trim(),
        balance: getBalance(student),
        paybill: school?.paybill,
        accountNumberFormat: school?.accountNumberFormat,
      })
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail.trim(),
          subject: `Fee Payment Reminder — ${student.name} — ${schoolName}`,
          html,
        }),
      })
      if (res.ok) {
        setEmailSentIds(prev => new Set([...prev, student.id]))
        setEmailFormId(null)
        // Save email to student record if new
        if (toEmail.trim() !== student.parentEmail) {
          fetch('/api/students', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: student.id, parentEmail: toEmail.trim() }),
          })
          setStudents(prev => prev.map(s => s.id === student.id ? { ...s, parentEmail: toEmail.trim() } : s))
        }
      } else {
        setEmailFormError('Failed to send. Check your email settings.')
      }
    } catch {
      setEmailFormError('Failed to send. Check your email settings.')
    }
    setEmailSendingId(null)
  }

  function openBulkModal() {
    const initial: Record<number, string> = {}
    withBalance.forEach(s => { initial[s.id] = s.parentEmail || '' })
    setBulkEmails(initial)
    setBulkResult(null)
    setBulkModal(true)
  }

  async function sendBulkEmails() {
    setBulkSending(true)
    setBulkResult(null)
    let sent = 0
    let skipped = 0
    const schoolName = school?.name || 'Your School'
    for (const student of withBalance) {
      const toEmail = (bulkEmails[student.id] || '').trim()
      if (!toEmail) { skipped++; continue }
      try {
        const html = reminderEmailHtml({
          schoolName,
          parentName: student.parentName || 'Parent',
          studentName: student.name,
          studentClass: `${student.class} ${student.stream || ''}`.trim(),
          balance: getBalance(student),
          paybill: school?.paybill,
          accountNumberFormat: school?.accountNumberFormat,
        })
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: toEmail,
            subject: `Fee Payment Reminder — ${student.name} — ${schoolName}`,
            html,
          }),
        })
        if (res.ok) {
          sent++
          setEmailSentIds(prev => new Set([...prev, student.id]))
          if (toEmail !== student.parentEmail) {
            fetch('/api/students', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId: student.id, parentEmail: toEmail }),
            })
            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, parentEmail: toEmail } : s))
          }
        } else {
          skipped++
        }
      } catch {
        skipped++
      }
    }
    setBulkResult({ sent, skipped })
    setBulkSending(false)
  }

  const withBalance = students.filter(s => getBalance(s) > 0)
  const totalOutstanding = withBalance.reduce((sum, s) => sum + getBalance(s), 0)

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden'}}>
      <style>{`
        @media (max-width: 640px) {
          .rem-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .rem-content { padding: 16px !important; }
          .rem-bulk-row { flex-direction: column !important; }
        }
      `}</style>

      <div className="rem-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px'}}>Reminders</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>
            {loading ? 'Loading...' : withBalance.length + ' parents with outstanding balances'}
          </p>
        </div>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          {!loading && withBalance.length > 0 && (
            <span style={{background: '#c8a84b', color: '#0a1f4e', fontSize: '11px', padding: '4px 12px', borderRadius: '999px', fontWeight: 700}}>
              KES {totalOutstanding.toLocaleString()} outstanding
            </span>
          )}
          <Link href="/dashboard" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="rem-content" style={{padding: '24px 32px'}}>
        {!loading && withBalance.length > 0 && (
          <div className="rem-bulk-row" style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' as const}}>
            <button
              onClick={() => {
                withBalance.forEach((student, i) => {
                  const msg = getMessage(student)
                  const phone = '254' + student.parentPhone.replace(/^0/, '')
                  const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg)
                  setTimeout(() => window.open(url, '_blank'), i * 1500)
                })
              }}
              style={{background: '#c8a84b', color: '#0a1f4e', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}
            >
              Send WhatsApp to all {withBalance.length} parents
            </button>
            <button
              onClick={openBulkModal}
              style={{background: '#0a1f4e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'}}
            >
              Send email to all {withBalance.length} parents
            </button>
          </div>
        )}

        {loading && (
          <div style={{textAlign: 'center', color: '#94a3b8', padding: '48px'}}>Loading...</div>
        )}

        {!loading && withBalance.length === 0 && (
          <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center'}}>
            <p style={{color: '#94a3b8', fontSize: '14px'}}>No outstanding balances. All students are fully paid!</p>
          </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {withBalance.map(student => {
            const balance = getBalance(student)
            const paid = getPaid(student)
            const percent = Math.round((paid / student.feeRequired) * 100)
            const msg = getMessage(student)
            const waPhone = student.parentPhone ? '254' + student.parentPhone.replace(/\s/g, '').replace(/^0/, '') : ''
            const waLink = waPhone ? 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(msg) : ''
            const isFormOpen = emailFormId === student.id
            const isSending = emailSendingId === student.id
            const wasSent = emailSentIds.has(student.id)

            return (
              <div key={student.id} style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                  <div>
                    <p style={{fontWeight: 600, color: '#0f172a', fontSize: '14px', marginBottom: '2px'}}>{student.name}</p>
                    <p style={{fontSize: '12px', color: '#94a3b8'}}>{student.class} {student.stream} · {student.parentName || 'Parent'} · {student.parentPhone}</p>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <p style={{color: '#e24b4a', fontWeight: 700, fontSize: '14px'}}>KES {balance.toLocaleString()}</p>
                    <p style={{fontSize: '11px', color: '#94a3b8'}}>{percent}% paid</p>
                  </div>
                </div>

                <div style={{background: '#f8f9fc', borderLeft: '3px solid #c8a84b', padding: '10px 12px', borderRadius: '0 4px 4px 0', fontSize: '12px', color: '#64748b', marginBottom: '12px'}}>
                  {msg}
                </div>

                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap' as const}}>
                  <button
                    onClick={() => copyMessage(student.id, msg)}
                    style={{fontSize: '12px', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '5px', background: '#fff', color: '#64748b', cursor: 'pointer'}}
                  >
                    {copied === student.id ? 'Copied!' : 'Copy message'}
                  </button>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{fontSize: '12px', background: '#25D366', color: '#fff', padding: '6px 12px', borderRadius: '5px', textDecoration: 'none', fontWeight: 600}}
                    >
                      Send on WhatsApp
                    </a>
                  )}
                  {wasSent ? (
                    <span style={{fontSize: '12px', color: '#0a7c3e', fontWeight: 700, padding: '6px 0'}}>✓ Email sent</span>
                  ) : (
                    <button
                      onClick={() => isFormOpen ? setEmailFormId(null) : openEmailForm(student)}
                      style={{fontSize: '12px', color: '#0a1f4e', background: 'none', border: '1px solid #0a1f4e', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 600}}
                    >
                      {isFormOpen ? 'Cancel' : 'Send via email'}
                    </button>
                  )}
                </div>

                {isFormOpen && (
                  <div style={{marginTop: '12px', background: '#f8f9fc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px'}}>
                    <label style={{fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px'}}>Parent email address</label>
                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap' as const}}>
                      <input
                        ref={emailInputRef}
                        type="email"
                        value={emailFormValue}
                        onChange={e => setEmailFormValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') sendReminderEmail(student, emailFormValue)
                          if (e.key === 'Escape') setEmailFormId(null)
                        }}
                        placeholder="parent@example.com"
                        style={{flex: 1, minWidth: '200px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', outline: 'none'}}
                      />
                      <button
                        onClick={() => sendReminderEmail(student, emailFormValue)}
                        disabled={isSending || !emailFormValue.trim()}
                        style={{background: isSending || !emailFormValue.trim() ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: isSending || !emailFormValue.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const}}
                      >
                        {isSending ? 'Sending...' : 'Send email'}
                      </button>
                    </div>
                    {emailFormError && (
                      <p style={{fontSize: '12px', color: '#e24b4a', marginTop: '8px', marginBottom: 0}}>{emailFormError}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {bulkModal && (
        <div
          style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'}}
          onClick={e => { if (e.target === e.currentTarget && !bulkSending) { setBulkModal(false); setBulkResult(null) } }}
        >
          <div style={{background: '#fff', borderRadius: '12px', width: '540px', maxWidth: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' as const}}>
            <div style={{padding: '24px 24px 16px', borderBottom: '1px solid #f1f5f9', flexShrink: 0}}>
              <h3 style={{fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px'}}>Send email reminders to all parents</h3>
              <p style={{fontSize: '12px', color: '#64748b', margin: 0}}>{withBalance.length} parents with outstanding balances · fill in missing emails before sending</p>
            </div>

            <div style={{overflowY: 'auto', flex: 1, padding: '16px 24px'}}>
              {withBalance.map(student => (
                <div key={student.id} style={{display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc'}}>
                  <div style={{flex: 1, minWidth: 0}}>
                    <p style={{fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const}}>{student.name}</p>
                    <p style={{fontSize: '11px', color: '#94a3b8', margin: 0}}>KES {getBalance(student).toLocaleString()} outstanding</p>
                  </div>
                  <input
                    type="email"
                    value={bulkEmails[student.id] ?? ''}
                    onChange={e => setBulkEmails(prev => ({ ...prev, [student.id]: e.target.value }))}
                    placeholder="parent@example.com"
                    style={{width: '220px', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '6px 9px', fontSize: '12px', outline: 'none', flexShrink: 0}}
                  />
                  {emailSentIds.has(student.id) && (
                    <span style={{fontSize: '11px', color: '#0a7c3e', fontWeight: 700, whiteSpace: 'nowrap' as const, flexShrink: 0}}>✓ Sent</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{padding: '16px 24px', borderTop: '1px solid #f1f5f9', flexShrink: 0}}>
              {bulkResult && (
                <p style={{fontSize: '13px', color: bulkResult.sent > 0 ? '#0a7c3e' : '#64748b', marginBottom: '12px', fontWeight: 600}}>
                  {bulkResult.sent > 0 ? `✓ ${bulkResult.sent} email${bulkResult.sent > 1 ? 's' : ''} sent` : ''}
                  {bulkResult.skipped > 0 ? `${bulkResult.sent > 0 ? ' · ' : ''}${bulkResult.skipped} skipped (no email)` : ''}
                </p>
              )}
              <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                <button
                  onClick={() => { if (!bulkSending) { setBulkModal(false); setBulkResult(null) } }}
                  disabled={bulkSending}
                  style={{padding: '9px 18px', borderRadius: '6px', fontSize: '13px', background: 'none', border: '1px solid #e2e8f0', cursor: bulkSending ? 'not-allowed' : 'pointer', color: '#64748b'}}
                >
                  {bulkResult ? 'Close' : 'Cancel'}
                </button>
                {!bulkResult && (
                  <button
                    onClick={sendBulkEmails}
                    disabled={bulkSending}
                    style={{padding: '9px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, background: bulkSending ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', cursor: bulkSending ? 'not-allowed' : 'pointer'}}
                  >
                    {bulkSending ? 'Sending...' : `Send ${withBalance.filter(s => (bulkEmails[s.id] || '').trim()).length} emails`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
