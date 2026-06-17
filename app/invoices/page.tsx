'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import RoleGuard from '@/components/RoleGuard'
import { normalizePhoneForWhatsApp } from '@/lib/phoneUtils'

// -- Status badge --------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    paid:  { bg: '#e1f5ee', color: '#166534' },
    sent:  { bg: '#dbeafe', color: '#1e40af' },
    draft: { bg: '#f1f5f9', color: 'var(--ep-text-secondary)' },
  }
  const s = styles[status] || styles.draft
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '10px', padding: '3px 9px', borderRadius: '999px', fontWeight: 700, textTransform: 'capitalize' as const }}>
      {status}
    </span>
  )
}

// -- Main page -----------------------------------------------------------------

export default function Invoices() {
  useEffect(() => {
    fetch('/api/auth/check-2fa').then(r => r.json()).then(d => { if (!d.verified) window.location.href = '/verify-2fa' })
  }, [])
  const [students, setStudents] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [invoices, setInvoices] = useState<Record<number, any>>({}) // studentId → invoice
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
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

  // Debounce search (and reset to page 1) so filtering/rendering isn't done on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  function getTotalPaid(student: any) {
    return student.payments?.reduce((s: number, p: any) => s + p.amount, 0) ?? 0
  }

  function getTotalDue(student: any) {
    return Math.max(0, (student.effectiveFee ?? student.feeRequired) - getTotalPaid(student))
  }

  function getStatus(student: any): string {
    return invoices[student.id]?.status || 'draft'
  }

  function buildBreakdown(student: any, totalPaid: number) {
    const cats = student.feeCategories as { name: string; amount: number }[] | undefined
    const effectiveFee = student.effectiveFee ?? student.feeRequired
    if (cats && cats.length > 0) {
      return {
        categories: cats,
        totalFee: student.feeRequired,
        totalPaid,
        totalDue: Math.max(0, effectiveFee - totalPaid),
      }
    }
    return {
      tuitionFee: student.tuitionFee,
      sportsFee: student.sportsFee,
      clubsFee: student.clubsFee,
      otherFee: student.otherFee,
      totalFee: student.feeRequired,
      totalPaid,
      totalDue: Math.max(0, effectiveFee - totalPaid),
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
    return inv
  }

  async function sendInvoiceEmail(student: any) {
    if (!student.parentEmail) return
    setSending(prev => ({ ...prev, [student.id]: true }))
    try {
      // The server issues the invoice (sequential number), renders the PDF, and emails it —
      // no client-side PDF generation, so bulk sends don't block the browser.
      const res = await fetch('/api/invoices/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id }),
      })
      if (!res.ok) throw new Error('send failed')
      const data = await res.json()
      if (data.invoice) setInvoices(prev => ({ ...prev, [student.id]: data.invoice }))
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
    const cats = student.feeCategories as { name: string; amount: number }[] | undefined
    if (cats && cats.length > 0) {
      cats.forEach(c => { if (c.amount > 0) lines.push(`- ${c.name}: KES ${c.amount.toLocaleString()}`) })
    } else {
      if (student.tuitionFee > 0) lines.push(`- Tuition: KES ${student.tuitionFee.toLocaleString()}`)
      if (student.sportsFee > 0) lines.push(`- Sports: KES ${student.sportsFee.toLocaleString()}`)
      if (student.clubsFee > 0) lines.push(`- Clubs: KES ${student.clubsFee.toLocaleString()}`)
      if (student.otherFee > 0) lines.push(`- Other: KES ${student.otherFee.toLocaleString()}`)
    }
    lines.push(`- Amount paid: KES ${totalPaid.toLocaleString()}`)
    lines.push(`- *TOTAL DUE: KES ${totalDue.toLocaleString()}*`)
    if (school.paybill) {
      const acctFmt = school.accountNumberFormat ? ` | Account: ${school.accountNumberFormat}` : ''
      lines.push(`\n*HOW TO PAY:* MPESA Paybill ${school.paybill}${acctFmt} | Amount: KES ${totalDue.toLocaleString()} | Due: ${dueDateStr}`)
    }
    lines.push(`— ${school.name}`)

    const waPhone = normalizePhoneForWhatsApp(student.parentPhone)
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank')

    saveInvoiceStatus(student.id, student, 'sent')
    setSentNow(prev => new Set([...prev, student.id]))
  }

  async function runBulkSend() {
    setBulkConfirm(false)
    // Bulk = email only. Sending WhatsApp in bulk would open hundreds of browser tabs,
    // so phone-only parents are surfaced for the per-row WhatsApp button instead.
    const eligible = filtered.filter(s => s.parentEmail)
    const noEmail = filtered.length - eligible.length
    setBulkState({ running: true, done: 0, total: eligible.length, summary: '' })

    let emailSent = 0
    let failed = 0
    const CONCURRENCY = 5
    for (let i = 0; i < eligible.length; i += CONCURRENCY) {
      const batch = eligible.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(batch.map(s => sendInvoiceEmail(s)))
      results.forEach(r => { if (r.status === 'fulfilled') emailSent++; else failed++ })
      setBulkState(prev => prev ? { ...prev, done: Math.min(i + CONCURRENCY, eligible.length) } : null)
    }

    setBulkState({
      running: false,
      done: eligible.length,
      total: eligible.length,
      summary: `${emailSent} invoice${emailSent !== 1 ? 's' : ''} emailed${failed ? `, ${failed} failed` : ''}${noEmail ? `, ${noEmail} skipped (no email — use the WhatsApp button on their row)` : ''}.`,
    })
  }

  const q = debouncedSearch.toLowerCase()
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.class || '').toLowerCase().includes(q) ||
    (s.admNo || '').toLowerCase().includes(q)
  )
  // Render only one page of rows at a time — avoids building tens of thousands of DOM nodes.
  // (filtered is still used for bulk send + counts so "send to all" covers the full set.)
  const PAGE_SIZE = 50
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const draftCount = filtered.filter(s => getStatus(s) === 'draft').length

  return (
    <RoleGuard requiredPermission="canManageInvoices">
    <main style={{ background: 'var(--ep-bg-secondary)', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
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
          <div style={{ background: 'var(--ep-card-bg)', border: '1px solid var(--ep-border)', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '8px' }}>Email invoices to {filtered.filter(s => s.parentEmail).length} parents?</h2>
            <p style={{ fontSize: '13px', color: 'var(--ep-text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              Parents with an email on file will receive a PDF invoice, sent a few at a time.
              Parents without an email aren&rsquo;t included here &mdash; use the WhatsApp button on their row to message them individually.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={runBulkSend} style={{ background: '#c8a84b', color: 'var(--ep-text-primary)', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Continue
              </button>
              <button onClick={() => setBulkConfirm(false)} style={{ background: 'var(--ep-bg-tertiary)', color: 'var(--ep-text-secondary)', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bulk progress / summary */}
        {bulkState && (
          <div style={{ background: bulkState.running ? 'var(--ep-card-bg)' : '#e1f5ee', border: `1px solid ${bulkState.running ? 'var(--ep-border)' : '#bbf7d0'}`, borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            {bulkState.running ? (
              <p style={{ fontSize: '13px', color: 'var(--ep-text-primary)', margin: 0 }}>
                Sending invoices… {bulkState.done} / {bulkState.total}
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: '#166534', margin: 0 }}>Done. {bulkState.summary}</p>
            )}
            {!bulkState.running && (
              <button onClick={() => setBulkState(null)} style={{ marginTop: '8px', fontSize: '12px', color: 'var(--ep-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Dismiss</button>
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
            style={{ border: '1px solid var(--ep-border)', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', width: '280px', outline: 'none' }}
          />
          <button
            onClick={() => setBulkConfirm(true)}
            disabled={filtered.length === 0 || !!bulkState?.running}
            style={{ background: '#c8a84b', color: 'var(--ep-text-primary)', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const, opacity: filtered.length === 0 ? 0.5 : 1 }}
          >
            Send invoices to all {filtered.length > 0 ? `(${filtered.length})` : ''}
          </button>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--ep-card-bg)', borderRadius: '8px', border: '1px solid var(--ep-border)' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--ep-text-tertiary)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--ep-text-tertiary)', fontSize: '13px' }}>
              {students.length === 0 ? 'No students found. Import students first.' : 'No students match your search.'}
            </div>
          ) : (
            <>
            <div className="inv-table-wrap" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px', minWidth: '860px' }}>
                <thead>
                  <tr style={{ textAlign: 'left' as const, borderBottom: '1px solid var(--ep-border)', background: 'var(--ep-bg-tertiary)' }}>
                    {['Student', 'Class', 'Fee breakdown', 'Paid', 'Due', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', color: 'var(--ep-text-tertiary)', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map(student => {
                    const totalPaid = getTotalPaid(student)
                    const totalDue = getTotalDue(student)
                    const status = getStatus(student)
                    const isSending = sending[student.id]
                    const wasSent = sentNow.has(student.id)
                    const hasEmail = !!student.parentEmail
                    const hasPhone = !!student.parentPhone
                    const hasFeeBreakdown = student.tuitionFee > 0 || student.sportsFee > 0 || student.clubsFee > 0 || student.otherFee > 0

                    return (
                      <tr key={student.id} style={{ borderBottom: '1px solid var(--ep-border)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--ep-text-primary)' }}>{student.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--ep-text-tertiary)' }}>
                            {student.admNo}
                            {invoices[student.id]?.invoiceNumber != null && (
                              <span style={{ marginLeft: 6, color: 'var(--ep-text-secondary)', fontWeight: 600 }}>
                                · INV-{String(invoices[student.id].invoiceNumber).padStart(5, '0')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--ep-text-secondary)', whiteSpace: 'nowrap' }}>{student.class}{student.stream ? ' ' + student.stream : ''}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {(() => {
                            const cats = student.feeCategories as { name: string; amount: number }[] | undefined
                            if (cats && cats.length > 0) {
                              return <div style={{ fontSize: '11px', color: 'var(--ep-text-secondary)', lineHeight: 1.6 }}>
                                {cats.filter(c => c.amount > 0).map((c, i) => <div key={i}>{c.name}: KES {c.amount.toLocaleString()}</div>)}
                              </div>
                            }
                            if (hasFeeBreakdown) {
                              return <div style={{ fontSize: '11px', color: 'var(--ep-text-secondary)', lineHeight: 1.6 }}>
                                {student.tuitionFee > 0 && <div>Tuition: KES {student.tuitionFee.toLocaleString()}</div>}
                                {student.sportsFee > 0 && <div>Sports: KES {student.sportsFee.toLocaleString()}</div>}
                                {student.clubsFee > 0 && <div>Clubs: KES {student.clubsFee.toLocaleString()}</div>}
                                {student.otherFee > 0 && <div>Other: KES {student.otherFee.toLocaleString()}</div>}
                              </div>
                            }
                            return <span style={{ fontSize: '11px', color: 'var(--ep-text-tertiary)' }}>KES {student.feeRequired.toLocaleString()}</span>
                          })()}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#166534', fontWeight: 600, whiteSpace: 'nowrap' }}>KES {totalPaid.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', color: totalDue > 0 ? '#dc2626' : '#166534', fontWeight: 600, whiteSpace: 'nowrap' }}>KES {totalDue.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {wasSent ? (
                            <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '10px', padding: '3px 9px', borderRadius: '999px', fontWeight: 700 }}>Sent</span>
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
                                {isSending ? '…' : 'Email'}
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--ep-text-tertiary)', padding: '5px 0' }}>No email</span>
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

        {/* Summary footer */}
        {!loading && students.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--ep-text-tertiary)', flexWrap: 'wrap' as const }}>
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
    </main>
    </RoleGuard>
  )
}
