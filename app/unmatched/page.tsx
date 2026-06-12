'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import RoleGuard from '@/components/RoleGuard'

interface SuggestedStudent {
  studentId: number
  studentName: string
  similarity: number
  matchedBy: string
}

interface Payment {
  id: number
  amount: number
  paidAt: string
  senderName: string | null
  mpesaRef: string | null
  senderPhone: string | null
  paymentType: string | null
  matchConfidence: string | null
  notes: string | null
  suggestedStudents: string | null
  originalDescription: string | null
}

interface Student {
  id: number
  name: string
  admNo: string
  class: string
  stream?: string | null
  parentName?: string | null
  parentPhone?: string | null
  feeRequired: number
  payments?: Array<{ amount: number }>
}

interface SplitRow {
  studentSearch: string
  selectedStudent: Student | null
  amount: string
}

export default function Unmatched() {
  useEffect(() => {
    fetch('/api/auth/check-2fa').then(r => r.json()).then(d => { if (!d.verified) window.location.href = '/verify-2fa' })
  }, [])

  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({})
  const [selectedStudents, setSelectedStudents] = useState<Record<number, Student>>({})
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState<Record<number, boolean>>({})
  const [autoMatching, setAutoMatching] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [splitModal, setSplitModal] = useState<{ payment: Payment; rows: SplitRow[] } | null>(null)
  const [splitSubmitting, setSplitSubmitting] = useState(false)
  const [splitError, setSplitError] = useState('')
  const dropdownRef = useRef<Record<number, HTMLDivElement | null>>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [pr, sr] = await Promise.all([fetch('/api/unmatched'), fetch('/api/students')])
    const [pd, sd] = await Promise.all([pr.json(), sr.json()])
    setPayments(Array.isArray(pd) ? pd : [])
    setStudents(Array.isArray(sd) ? sd : [])
    setLoading(false)
    setSearchTerms({})
    setSelectedStudents({})
    setMatching({})
    setOpenDropdown(null)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (openDropdown === null) return
      const el = dropdownRef.current[openDropdown]
      if (el && !el.contains(e.target as Node)) setOpenDropdown(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openDropdown])

  // Parse pre-computed suggestions stored as JSON in the payment record
  function parseSuggestions(payment: Payment): SuggestedStudent[] {
    if (!payment.suggestedStudents) return []
    try { return JSON.parse(payment.suggestedStudents) } catch { return [] }
  }

  // Fallback: compute suggestions on the client from sender name word matching
  function getClientSuggestion(payment: Payment): Student | null {
    const name = (payment.senderName || '').toLowerCase().trim()
    if (!name || name.length < 4) return null
    const words = name.split(/\s+/).filter((w: string) => w.length > 2)
    if (words.length < 1) return null
    return students.find(s => {
      const target = `${s.name || ''} ${s.parentName || ''} ${s.parentName || ''}`.toLowerCase()
      return words.filter((w: string) => target.includes(w)).length >= Math.min(2, words.length)
    }) || null
  }

  function getResults(paymentId: number): Student[] {
    const q = (searchTerms[paymentId] || '').toLowerCase().trim()
    if (!q || q.length < 1) return []
    return students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      (s.admNo || '').toLowerCase().includes(q) ||
      (s.parentName || '').toLowerCase().includes(q) ||
      (s.parentPhone || '').toLowerCase().includes(q)
    ).slice(0, 8)
  }

  const autoMatchPairs = payments.flatMap(p => {
    if (!p.mpesaRef) return []
    const ref = p.mpesaRef.trim().toLowerCase()
    const match = students.find(s => (s.admNo || '').trim().toLowerCase() === ref)
    return match ? [{ paymentId: p.id, studentId: match.id, paymentRef: p.mpesaRef, studentName: match.name }] : []
  })

  async function autoMatchAll() {
    setAutoMatching(true)
    for (const { paymentId, studentId } of autoMatchPairs) {
      await fetch('/api/unmatched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, studentId }),
      })
    }
    await fetchData()
    setAutoMatching(false)
  }

  async function confirmMatch(paymentId: number) {
    const student = selectedStudents[paymentId]
    if (!student || matching[paymentId]) return
    setMatching(prev => ({ ...prev, [paymentId]: true }))
    await fetch('/api/unmatched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, studentId: student.id }),
    })
    setPayments(prev => prev.filter(p => p.id !== paymentId))
    setSelectedStudents(prev => { const n = { ...prev }; delete n[paymentId]; return n })
    setSearchTerms(prev => { const n = { ...prev }; delete n[paymentId]; return n })
    setMatching(prev => { const n = { ...prev }; delete n[paymentId]; return n })
  }

  function selectStudent(paymentId: number, student: Student) {
    setSelectedStudents(prev => ({ ...prev, [paymentId]: student }))
    setSearchTerms(prev => ({ ...prev, [paymentId]: student.name }))
    setOpenDropdown(null)
  }

  function clearSelection(paymentId: number) {
    setSelectedStudents(prev => { const n = { ...prev }; delete n[paymentId]; return n })
    setSearchTerms(prev => ({ ...prev, [paymentId]: '' }))
  }

  // Parse detected names from the notes field (e.g. "May cover multiple students: Alice, Bob")
  function parseDetectedNames(notes: string | null): string[] {
    if (!notes) return []
    const match = notes.match(/may cover multiple students:\s*(.+)/i)
    if (!match) return []
    return match[1].split(',').map(n => n.trim()).filter(Boolean)
  }

  function openSplitModal(payment: Payment) {
    const names = parseDetectedNames(payment.notes)
    const suggestions = parseSuggestions(payment)
    const rowCount = Math.max(names.length, suggestions.length, 2)
    const defaultAmount = rowCount > 0 ? Math.floor(payment.amount / rowCount) : payment.amount

    const rows: SplitRow[] = Array.from({ length: rowCount }, (_, i) => {
      const suggestedStudentId = suggestions[i]?.studentId
      const suggestedStudent = suggestedStudentId ? students.find(s => s.id === suggestedStudentId) ?? null : null
      return {
        studentSearch: suggestedStudent?.name ?? names[i] ?? '',
        selectedStudent: suggestedStudent,
        amount: String(defaultAmount),
      }
    })
    setSplitModal({ payment, rows })
    setSplitError('')
  }

  function updateSplitRow(idx: number, patch: Partial<SplitRow>) {
    setSplitModal(prev => {
      if (!prev) return prev
      const rows = [...prev.rows]
      rows[idx] = { ...rows[idx], ...patch }
      return { ...prev, rows }
    })
  }

  function addSplitRow() {
    setSplitModal(prev => {
      if (!prev) return prev
      return { ...prev, rows: [...prev.rows, { studentSearch: '', selectedStudent: null, amount: '0' }] }
    })
  }

  function removeSplitRow(idx: number) {
    setSplitModal(prev => {
      if (!prev || prev.rows.length <= 2) return prev
      return { ...prev, rows: prev.rows.filter((_, i) => i !== idx) }
    })
  }

  function getSplitStudentResults(search: string): Student[] {
    const q = search.toLowerCase().trim()
    if (!q || q.length < 1) return []
    return students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      (s.admNo || '').toLowerCase().includes(q) ||
      (s.parentName || '').toLowerCase().includes(q)
    ).slice(0, 6)
  }

  const splitTotal = splitModal
    ? splitModal.rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    : 0
  const splitValid = splitModal
    ? Math.abs(splitTotal - splitModal.payment.amount) <= 1 &&
      splitModal.rows.every(r => r.selectedStudent !== null && parseFloat(r.amount) > 0)
    : false

  async function confirmSplit() {
    if (!splitModal || !splitValid || splitSubmitting) return
    setSplitSubmitting(true)
    setSplitError('')
    const res = await fetch('/api/unmatched', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: splitModal.payment.id,
        splits: splitModal.rows.map(r => ({ studentId: r.selectedStudent!.id, amount: parseFloat(r.amount) })),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setSplitError(data.error || 'Split failed')
      setSplitSubmitting(false)
      return
    }
    setSplitModal(null)
    setSplitSubmitting(false)
    await fetchData()
  }

  function studentBalance(s: Student): number {
    const paid = (s.payments || []).reduce((sum, p) => sum + p.amount, 0)
    return s.feeRequired - paid
  }

  // Left border colour by payment type
  function cardBorderColor(payment: Payment): string {
    if (payment.paymentType === 'multiple_students') return '#d97706'
    if (payment.paymentType === 'kits_activity') return '#ea580c'
    if (payment.matchConfidence === 'low') return '#eab308'
    return 'var(--ep-border)'
  }

  function PaymentTypeBadge({ type }: { type: string | null }) {
    if (!type) return null
    const map: Record<string, { label: string; bg: string; color: string }> = {
      mpesa_wallet:      { label: 'MPESA Wallet', bg: '#e0f2fe', color: '#0369a1' },
      kits_name:         { label: 'KITS', bg: '#f0fdf4', color: '#166534' },
      kits_activity:     { label: 'Activity', bg: '#fff7ed', color: '#9a3412' },
      multiple_students: { label: 'Multi-student', bg: '#fef3c7', color: '#92400e' },
      unclear:           { label: 'Unclear', bg: '#fafafa', color: '#6b7280' },
      admission_number:  { label: 'Adm No.', bg: '#e0f2fe', color: '#0369a1' },
      unknown:           { label: 'Unknown', bg: '#fafafa', color: '#6b7280' },
    }
    const s = map[type] || { label: type, bg: '#fafafa', color: '#6b7280' }
    return (
      <span style={{ background: s.bg, color: s.color, fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>
        {s.label}
      </span>
    )
  }

  return (
    <RoleGuard requiredPermission="canUpload">
    <main style={{ background: 'var(--ep-bg-secondary)', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 640px) {
          .unm-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .unm-body { padding: 16px !important; }
        }
        .unm-result-row:hover { background: var(--ep-hover, #f0f4f9) !important; }
        .unm-confirm-btn:hover:not(:disabled) { opacity: 0.92; }
        @keyframes unm-spin { to { transform: rotate(360deg); } }
        @keyframes modal-fade { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* Header */}
      <div className="unm-header" style={{ background: '#0a1f4e', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', margin: 0 }}>
          Unmatched Payments
        </h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!loading && (
            <span style={{ background: payments.length > 0 ? '#e24b4a' : '#0a7c3e', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px' }}>
              {payments.length} pending
            </span>
          )}
          <Link href="/dashboard" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none' }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="unm-body" style={{ padding: '24px 32px', maxWidth: '860px', margin: '0 auto', boxSizing: 'border-box' as const }}>

        {loading && <div style={{ textAlign: 'center', color: 'var(--ep-text-tertiary)', padding: '64px', fontSize: '14px' }}>Loading…</div>}

        {!loading && payments.length === 0 && (
          <div style={{ background: 'var(--ep-card-bg)', borderRadius: '10px', border: '1px solid var(--ep-border)', padding: '56px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✓</div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '4px' }}>All clear</p>
            <p style={{ fontSize: '13px', color: 'var(--ep-text-tertiary)', margin: 0 }}>All payments have been matched to students.</p>
          </div>
        )}

        {/* Auto-match banner */}
        {!loading && autoMatchPairs.length > 0 && (
          <div style={{ background: '#c8a84b', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ep-text-primary)', margin: '0 0 3px' }}>
                {autoMatchPairs.length} payment{autoMatchPairs.length !== 1 ? 's' : ''} can be matched by admission number
              </p>
              <p style={{ fontSize: '12px', color: '#3d2a00', margin: 0, opacity: 0.8 }}>
                {autoMatchPairs.slice(0, 3).map(p => `${p.paymentRef} → ${p.studentName}`).join(' · ')}
                {autoMatchPairs.length > 3 ? ` · +${autoMatchPairs.length - 3} more` : ''}
              </p>
            </div>
            <button onClick={autoMatchAll} disabled={autoMatching}
              style={{ background: '#0a1f4e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '7px', fontSize: '13px', fontWeight: 700, cursor: autoMatching ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' as const, opacity: autoMatching ? 0.7 : 1 }}>
              {autoMatching ? 'Matching…' : 'Auto-match all'}
            </button>
          </div>
        )}

        {/* Payment cards */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {payments.map(payment => {
              const sel = selectedStudents[payment.id]
              const term = searchTerms[payment.id] || ''
              const results = getResults(payment.id)
              const isMatching = matching[payment.id] || false
              const isDropdownOpen = openDropdown === payment.id && !sel && results.length > 0
              const precomputedSuggestions = parseSuggestions(payment)
              const clientSuggestion = precomputedSuggestions.length === 0 ? getClientSuggestion(payment) : null
              const isMultiStudent = payment.paymentType === 'multiple_students'
              const isActivity = payment.paymentType === 'kits_activity'
              const isLowConf = payment.matchConfidence === 'low'
              const borderColor = cardBorderColor(payment)

              return (
                <div key={payment.id} style={{ background: 'var(--ep-card-bg)', borderRadius: '10px', border: '1px solid var(--ep-border)', borderLeft: `4px solid ${borderColor}`, position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                  {/* Payment info header */}
                  <div style={{ background: '#0a1f4e', padding: '16px 20px', borderRadius: '6px 0 0 0' }}>

                    {/* Type header banner for special types */}
                    {isMultiStudent && (
                      <div style={{ background: 'rgba(217,119,6,0.25)', borderRadius: '4px', padding: '6px 10px', marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#fcd34d' }}>
                        Multiple student payment — manual split required
                      </div>
                    )}
                    {isActivity && (
                      <div style={{ background: 'rgba(234,88,12,0.25)', borderRadius: '4px', padding: '6px 10px', marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#fdba74' }}>
                        Activity payment
                      </div>
                    )}
                    {isLowConf && !isMultiStudent && !isActivity && (
                      <div style={{ background: 'rgba(234,179,8,0.2)', borderRadius: '4px', padding: '6px 10px', marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#fef08a' }}>
                        Please verify — matched by name similarity
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' as const }}>
                      <div style={{ flex: 1 }}>
                        {payment.senderName && (
                          <p style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.2 }}>
                            {payment.senderName}
                          </p>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                          <PaymentTypeBadge type={payment.paymentType} />
                          {payment.mpesaRef ? (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#c8a84b', fontFamily: 'monospace', background: 'rgba(200,168,75,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                              {payment.mpesaRef}
                            </span>
                          ) : (
                            <span style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3c8', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                              No reference
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: '#94a3c8' }}>
                            {new Date(payment.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Notes (activity description, multi-student names, etc.) */}
                        {payment.notes && (
                          <div style={{ marginTop: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', color: '#cbd5e1' }}>
                            {payment.notes}
                          </div>
                        )}

                        {/* Pre-computed suggestions (for low-conf / unmatched single-name) */}
                        {!isMultiStudent && !isActivity && precomputedSuggestions.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: '#94a3c8' }}>Could this be:</span>
                            {precomputedSuggestions.map(sg => {
                              const found = students.find(s => s.id === sg.studentId)
                              if (!found) return null
                              return (
                                <button key={sg.studentId}
                                  onMouseDown={e => { e.preventDefault(); selectStudent(payment.id, found) }}
                                  style={{ background: 'rgba(200,168,75,0.2)', border: '1px solid rgba(200,168,75,0.4)', color: '#fef3c7', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>
                                  {found.name} ({found.class}) · {Math.round(sg.similarity * 100)}%
                                </button>
                              )
                            })}
                          </div>
                        )}

                        {/* Fallback client suggestion */}
                        {!isMultiStudent && !isActivity && precomputedSuggestions.length === 0 && clientSuggestion && (
                          <div style={{ marginTop: '6px', background: 'rgba(200,168,75,0.18)', borderRadius: '5px', padding: '5px 10px', fontSize: '11px', color: '#fef3c7', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span>Suggestion: Could this be <strong>{clientSuggestion.name}</strong> ({clientSuggestion.class})?</span>
                            <button onMouseDown={e => { e.preventDefault(); selectStudent(payment.id, clientSuggestion) }}
                              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '3px', cursor: 'pointer' }}>
                              Select
                            </button>
                          </div>
                        )}
                      </div>

                      <p style={{ fontSize: '28px', fontWeight: 900, color: '#fff', margin: 0, whiteSpace: 'nowrap' as const }}>
                        KES {payment.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Action section */}
                  <div style={{ padding: '16px 20px' }}>

                    {/* Multiple student — show split button */}
                    {isMultiStudent && (
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '0 0 10px' }}>
                          This payment likely covers multiple students. Use the split tool to divide it, or assign it to a single student below.
                        </p>
                        <button
                          onClick={() => openSplitModal(payment)}
                          style={{ background: '#d97706', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '7px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '12px' }}>
                          Split payment
                        </button>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ep-text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '8px' }}>
                          Or assign to single student
                        </p>
                      </div>
                    )}

                    {/* Activity — show note */}
                    {isActivity && (
                      <p style={{ fontSize: '11px', color: 'var(--ep-text-tertiary)', margin: '0 0 12px' }}>
                        Search for the student who made this activity payment.
                      </p>
                    )}

                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ep-text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>
                      {isMultiStudent ? '' : 'Match to student'}
                    </p>

                    {/* Search input + dropdown */}
                    <div ref={el => { dropdownRef.current[payment.id] = el }} style={{ position: 'relative' as const }}>
                      <input
                        type="text"
                        placeholder="Search by name, admission no, parent name or phone…"
                        value={term}
                        onChange={e => {
                          const val = e.target.value
                          setSearchTerms(prev => ({ ...prev, [payment.id]: val }))
                          setOpenDropdown(payment.id)
                          if (sel) clearSelection(payment.id)
                        }}
                        onFocus={() => { if (!sel) setOpenDropdown(payment.id) }}
                        style={{ width: '100%', border: `2px solid ${sel ? '#c8a84b' : 'var(--ep-input-border)'}`, borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, background: sel ? 'rgba(200,168,75,0.08)' : 'var(--ep-input-bg)' }}
                      />
                      {isDropdownOpen && (
                        <div style={{ position: 'absolute' as const, top: '100%', left: 0, right: 0, background: 'var(--ep-bg-tertiary)', border: '1px solid var(--ep-border)', borderRadius: '0 0 6px 6px', boxShadow: '0 4px 12px var(--ep-shadow)', zIndex: 9999, maxHeight: '220px', overflowY: 'auto' as const }}>
                          {results.map(s => {
                            const bal = studentBalance(s)
                            return (
                              <button key={s.id} className="unm-result-row"
                                onMouseDown={e => { e.preventDefault(); selectStudent(payment.id, s) }}
                                style={{ display: 'block', width: '100%', padding: '10px 12px', textAlign: 'left' as const, background: 'var(--ep-bg-tertiary)', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--ep-border)' }}>
                                <div style={{ fontWeight: 600, color: 'var(--ep-text-primary)', fontSize: '14px' }}>{s.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--ep-text-tertiary)', marginTop: '2px' }}>
                                  {s.admNo} · {s.class}{s.stream ? ' ' + s.stream : ''}
                                  {s.parentName && ` · ${s.parentName}`}
                                  <span style={{ color: bal > 0 ? '#e24b4a' : '#0a7c3e', fontWeight: 600 }}>
                                    {' · '}Balance: KES {bal.toLocaleString()}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Selected student + confirm */}
                    {sel && (
                      <div style={{ marginTop: '12px', background: 'rgba(200,168,75,0.08)', border: '2px solid rgba(200,168,75,0.4)', borderRadius: '8px', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ep-text-primary)', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 4px' }}>Matched to</p>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ep-text-primary)', margin: '0 0 2px' }}>{sel.name}</p>
                            <p style={{ fontSize: '12px', color: 'var(--ep-text-secondary)', margin: 0 }}>
                              {sel.admNo} · {sel.class}{sel.stream ? ' ' + sel.stream : ''}
                              {' · '}
                              <span style={{ color: studentBalance(sel) > 0 ? '#e24b4a' : '#0a7c3e', fontWeight: 600 }}>
                                Balance: KES {studentBalance(sel).toLocaleString()}
                              </span>
                            </p>
                          </div>
                          <button onClick={() => clearSelection(payment.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--ep-text-tertiary)', cursor: 'pointer', fontSize: '16px', padding: '2px', lineHeight: 1 }}>×</button>
                        </div>
                        <button className="unm-confirm-btn" onClick={() => confirmMatch(payment.id)} disabled={isMatching}
                          style={{ marginTop: '12px', width: '100%', background: isMatching ? '#94a3b8' : '#c8a84b', color: isMatching ? '#fff' : '#0a1f4e', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: isMatching ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          {isMatching ? (
                            <><span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'unm-spin 0.7s linear infinite' }} />Saving…</>
                          ) : (
                            `Confirm — assign KES ${payment.amount.toLocaleString()} to ${sel.name}`
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Split payment modal */}
      {splitModal && (
        <div style={{ position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setSplitModal(null) }}>
          <div style={{ background: 'var(--ep-card-bg)', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', animation: 'modal-fade 0.15s ease' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ep-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ep-text-primary)', margin: '0 0 3px' }}>Split payment</p>
                  <p style={{ fontSize: '12px', color: 'var(--ep-text-tertiary)', margin: 0 }}>
                    Total: <strong>KES {splitModal.payment.amount.toLocaleString()}</strong>
                    {splitModal.payment.notes && <> · {splitModal.payment.notes}</>}
                  </p>
                </div>
                <button onClick={() => setSplitModal(null)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--ep-text-tertiary)', lineHeight: 1 }}>×</button>
              </div>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {splitModal.rows.map((row, idx) => (
                <SplitRow
                  key={idx}
                  row={row}
                  idx={idx}
                  canRemove={splitModal.rows.length > 2}
                  onUpdate={patch => updateSplitRow(idx, patch)}
                  onRemove={() => removeSplitRow(idx)}
                  searchStudents={getSplitStudentResults}
                  studentBalance={studentBalance}
                />
              ))}

              <button onClick={addSplitRow}
                style={{ background: 'none', border: '1px dashed var(--ep-border)', borderRadius: '6px', padding: '8px', fontSize: '12px', color: 'var(--ep-text-tertiary)', cursor: 'pointer', width: '100%' }}>
                + Add another student
              </button>

              {/* Running total indicator */}
              <div style={{ background: 'var(--ep-bg-secondary)', borderRadius: '6px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ color: 'var(--ep-text-secondary)' }}>Split total</span>
                <span style={{ fontWeight: 700, color: Math.abs(splitTotal - splitModal.payment.amount) <= 1 ? '#16a34a' : '#dc2626' }}>
                  KES {splitTotal.toLocaleString()} {Math.abs(splitTotal - splitModal.payment.amount) <= 1 ? '✓' : `(need KES ${splitModal.payment.amount.toLocaleString()})`}
                </span>
              </div>

              {splitError && (
                <div style={{ background: '#fcebeb', border: '1px solid #fecaca', color: '#991b1b', fontSize: '12px', padding: '10px 12px', borderRadius: '6px' }}>
                  {splitError}
                </div>
              )}

              <button onClick={confirmSplit} disabled={!splitValid || splitSubmitting}
                style={{ background: splitValid && !splitSubmitting ? '#c8a84b' : '#94a3b8', color: splitValid && !splitSubmitting ? '#0a1f4e' : '#fff', border: 'none', padding: '13px', borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: splitValid && !splitSubmitting ? 'pointer' : 'not-allowed', width: '100%' }}>
                {splitSubmitting ? 'Saving…' : `Confirm split into ${splitModal.rows.length} payments`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </RoleGuard>
  )
}

// ---------------------------------------------------------------------------
// Split row sub-component (inline, avoids separate file)
// ---------------------------------------------------------------------------

interface SplitRowProps {
  row: SplitRow
  idx: number
  canRemove: boolean
  onUpdate: (patch: Partial<SplitRow>) => void
  onRemove: () => void
  searchStudents: (q: string) => Student[]
  studentBalance: (s: Student) => number
}

function SplitRow({ row, idx, canRemove, onUpdate, onRemove, searchStudents, studentBalance }: SplitRowProps) {
  const [open, setOpen] = useState(false)
  const results = searchStudents(row.studentSearch)

  return (
    <div style={{ background: 'var(--ep-bg-secondary)', borderRadius: '8px', padding: '12px 14px', border: '1px solid var(--ep-border)', position: 'relative' as const }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ep-text-tertiary)', paddingTop: '12px', minWidth: '16px' }}>{idx + 1}.</span>
        <div style={{ flex: 1, position: 'relative' as const }}>
          <input
            type="text"
            placeholder="Search student…"
            value={row.studentSearch}
            onChange={e => { onUpdate({ studentSearch: e.target.value, selectedStudent: null }); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            style={{ width: '100%', border: `2px solid ${row.selectedStudent ? '#c8a84b' : 'var(--ep-input-border)'}`, borderRadius: '6px', padding: '9px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const, background: row.selectedStudent ? 'rgba(200,168,75,0.08)' : 'var(--ep-input-bg)' }}
          />
          {open && results.length > 0 && (
            <div style={{ position: 'absolute' as const, top: '100%', left: 0, right: 0, background: 'var(--ep-bg-tertiary)', border: '1px solid var(--ep-border)', borderRadius: '0 0 6px 6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '180px', overflowY: 'auto' as const }}>
              {results.map(s => (
                <button key={s.id}
                  onMouseDown={e => { e.preventDefault(); onUpdate({ studentSearch: s.name, selectedStudent: s }); setOpen(false) }}
                  style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left' as const, background: 'none', border: 'none', borderBottom: '1px solid var(--ep-border)', cursor: 'pointer', fontSize: '13px' }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  <span style={{ color: 'var(--ep-text-tertiary)', marginLeft: '6px', fontSize: '11px' }}>
                    {s.admNo} · {s.class} · Bal: KES {studentBalance(s).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <input
          type="number"
          placeholder="Amount"
          value={row.amount}
          onChange={e => onUpdate({ amount: e.target.value })}
          style={{ width: '110px', border: '2px solid var(--ep-input-border)', borderRadius: '6px', padding: '9px 10px', fontSize: '13px', outline: 'none', background: 'var(--ep-input-bg)' }}
        />
        {canRemove && (
          <button onClick={onRemove}
            style={{ background: 'none', border: 'none', color: 'var(--ep-text-tertiary)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, paddingTop: '8px' }}>×</button>
        )}
      </div>
      {row.selectedStudent && (
        <p style={{ margin: 0, fontSize: '11px', color: '#16a34a', marginLeft: '24px' }}>
          ✓ {row.selectedStudent.name} · {row.selectedStudent.admNo} · {row.selectedStudent.class}
        </p>
      )}
    </div>
  )
}
