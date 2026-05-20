'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import RoleGuard from '@/components/RoleGuard'

export default function Unmatched() {
  useEffect(() => {
    fetch('/api/auth/check-2fa').then(r => r.json()).then(d => { if (!d.verified) window.location.href = '/verify-2fa' })
  }, [])
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({})
  const [selectedStudents, setSelectedStudents] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState<Record<number, boolean>>({})
  const [autoMatching, setAutoMatching] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (openDropdown === null) return
      const el = dropdownRef.current[openDropdown]
      if (el && !el.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openDropdown])

  // Suggest closest student based on sender name words
  function getSuggestion(payment: any): any | null {
    const name = (payment.senderName || '').toLowerCase().trim()
    if (!name || name.length < 4) return null
    const words = name.split(/\s+/).filter((w: string) => w.length > 2)
    if (words.length < 1) return null
    return students.find(s => {
      const target = `${(s.name || '')} ${(s.parentName || '')} ${(s.parent2Name || '')}`.toLowerCase()
      return words.filter((w: string) => target.includes(w)).length >= Math.min(2, words.length)
    }) || null
  }

  // Client-side search: match against name, admNo, parentName, parentPhone
  function getResults(paymentId: number): any[] {
    const q = (searchTerms[paymentId] || '').toLowerCase().trim()
    if (!q || q.length < 1) return []
    return students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      (s.admNo || '').toLowerCase().includes(q) ||
      (s.parentName || '').toLowerCase().includes(q) ||
      (s.parentPhone || '').toLowerCase().includes(q)
    ).slice(0, 8)
  }

  // Auto-match candidates: payment mpesaRef exactly matches a student admNo (case-insensitive)
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

  function selectStudent(paymentId: number, student: any) {
    setSelectedStudents(prev => ({ ...prev, [paymentId]: student }))
    setSearchTerms(prev => ({ ...prev, [paymentId]: student.name }))
    setOpenDropdown(null)
  }

  function clearSelection(paymentId: number) {
    setSelectedStudents(prev => { const n = { ...prev }; delete n[paymentId]; return n })
    setSearchTerms(prev => ({ ...prev, [paymentId]: '' }))
  }

  return (
    <RoleGuard requiredPermission="canUpload">
    <main style={{ background: 'var(--ep-bg-secondary)', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 640px) {
          .unm-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .unm-body { padding: 16px !important; }
        }
        .unm-result-row:hover { background: #f0f4f9 !important; }
        .unm-confirm-btn:hover:not(:disabled) { opacity: 0.92; }
      `}</style>

      {/* Header */}
      <div className="unm-header" style={{ background: '#0a1f4e', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', margin: 0 }}>
          Unmatched Payments
        </h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!loading && (
            <span style={{
              background: payments.length > 0 ? '#e24b4a' : '#0a7c3e',
              color: '#fff', fontSize: '11px', fontWeight: 700,
              padding: '4px 12px', borderRadius: '999px',
            }}>
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

        {loading && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '64px', fontSize: '14px' }}>Loading…</div>
        )}

        {!loading && payments.length === 0 && (
          <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '56px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>Done</div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>All clear</p>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>All payments have been matched to students.</p>
          </div>
        )}

        {/* Auto-match banner */}
        {!loading && autoMatchPairs.length > 0 && (
          <div style={{
            background: '#c8a84b', borderRadius: '10px', padding: '16px 20px',
            marginBottom: '20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const,
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#0a1f4e', margin: '0 0 3px' }}>
                {autoMatchPairs.length} payment{autoMatchPairs.length !== 1 ? 's' : ''} can be matched by admission number
              </p>
              <p style={{ fontSize: '12px', color: '#3d2a00', margin: 0, opacity: 0.8 }}>
                {autoMatchPairs.slice(0, 3).map(p => `${p.paymentRef} → ${p.studentName}`).join(' · ')}
                {autoMatchPairs.length > 3 ? ` · +${autoMatchPairs.length - 3} more` : ''}
              </p>
            </div>
            <button
              onClick={autoMatchAll}
              disabled={autoMatching}
              style={{
                background: '#0a1f4e', color: '#fff', border: 'none',
                padding: '10px 20px', borderRadius: '7px', fontSize: '13px',
                fontWeight: 700, cursor: autoMatching ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap' as const, opacity: autoMatching ? 0.7 : 1,
              }}
            >
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

              return (
                <div key={payment.id} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                  {/* Payment info */}
                  {(() => {
                    const suggestion = getSuggestion(payment)
                    return (
                      <div style={{ background: '#0a1f4e', padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' as const }}>
                          <div style={{ flex: 1 }}>
                            {payment.senderName && (
                              <p style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.2 }}>
                                {payment.senderName}
                              </p>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                              {payment.mpesaRef ? (
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#c8a84b', fontFamily: 'monospace', background: 'rgba(200,168,75,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                                  {payment.mpesaRef}
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3c8', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                                  No reference
                                </span>
                              )}
                              {payment.senderPhone && (
                                <span style={{ fontSize: '11px', color: '#94a3c8' }}>{payment.senderPhone}</span>
                              )}
                              <span style={{ fontSize: '11px', color: '#94a3c8' }}>
                                {new Date(payment.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            {suggestion && (
                              <div style={{ marginTop: '6px', background: 'rgba(200,168,75,0.18)', borderRadius: '5px', padding: '5px 10px', fontSize: '11px', color: '#fef3c7', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span>Suggestion:</span>
                                <span>Could this be <strong>{suggestion.name}</strong> ({suggestion.class})?</span>
                                <button
                                  onMouseDown={e => { e.preventDefault(); selectStudent(payment.id, suggestion) }}
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
                    )
                  })()}

                  {/* Match section */}
                  <div style={{ padding: '16px 20px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '10px' }}>
                      Match to student
                    </p>

                    {/* Search input + dropdown */}
                    <div
                      ref={el => { dropdownRef.current[payment.id] = el }}
                      style={{ position: 'relative' as const }}
                    >
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
                        onFocus={() => {
                          if (!sel) setOpenDropdown(payment.id)
                        }}
                        style={{
                          width: '100%', border: `2px solid ${sel ? '#c8a84b' : '#0a1f4e'}`,
                          borderRadius: '8px', padding: '10px 14px', fontSize: '14px',
                          outline: 'none', boxSizing: 'border-box' as const,
                          background: sel ? '#fffdf5' : '#fff',
                        }}
                      />

                      {/* Dropdown results */}
                      {isDropdownOpen && (
                        <div style={{
                          position: 'absolute' as const, top: '100%', left: 0, right: 0,
                          background: '#ffffff', border: '1px solid #e2e8f0',
                          borderRadius: '0 0 6px 6px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 9999,
                          maxHeight: '220px', overflowY: 'auto' as const, width: '100%',
                        }}>
                          {results.map((s, i) => {
                            const paid = (s.payments || []).reduce((sum: number, p: any) => sum + p.amount, 0)
                            const balance = s.feeRequired - paid
                            return (
                              <button
                                key={s.id}
                                className="unm-result-row"
                                onMouseDown={e => { e.preventDefault(); selectStudent(payment.id, s) }}
                                style={{
                                  display: 'block', width: '100%', padding: '10px 12px',
                                  textAlign: 'left' as const, background: '#fff', border: 'none',
                                  cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                                }}
                              >
                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{s.name}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                  {s.admNo} · {s.class}{s.stream ? ' ' + s.stream : ''}
                                  {s.parentName && ` · ${s.parentName}`}
                                  <span style={{ color: balance > 0 ? '#e24b4a' : '#0a7c3e', fontWeight: 600 }}>
                                    {' · '}Balance: KES {balance.toLocaleString()}
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
                      <div style={{ marginTop: '12px', background: '#f0f7ff', border: '2px solid #0a1f4e', borderRadius: '8px', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontSize: '11px', fontWeight: 700, color: '#0a1f4e', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 4px' }}>
                              Matched to
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{sel.name}</p>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                              {sel.admNo} · {sel.class}{sel.stream ? ' ' + sel.stream : ''}
                              {' · '}
                              <span style={{ color: (sel.feeRequired - ((sel.payments || []).reduce((s: number, p: any) => s + p.amount, 0))) > 0 ? '#e24b4a' : '#0a7c3e', fontWeight: 600 }}>
                                Balance: KES {(sel.feeRequired - ((sel.payments || []).reduce((s: number, p: any) => s + p.amount, 0))).toLocaleString()}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => clearSelection(payment.id)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: '2px', lineHeight: 1 }}
                          >
                            x
                          </button>
                        </div>
                        <button
                          className="unm-confirm-btn"
                          onClick={() => confirmMatch(payment.id)}
                          disabled={isMatching}
                          style={{
                            marginTop: '12px', width: '100%',
                            background: isMatching ? '#94a3b8' : '#c8a84b',
                            color: isMatching ? '#fff' : '#0a1f4e',
                            border: 'none', padding: '12px',
                            borderRadius: '8px', fontSize: '14px', fontWeight: 800,
                            cursor: isMatching ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          }}
                        >
                          {isMatching ? (
                            <>
                              <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'unm-spin 0.7s linear infinite' }} />
                              Saving…
                            </>
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

      <style>{`@keyframes unm-spin { to { transform: rotate(360deg); } }`}</style>
    </main>
    </RoleGuard>
  )
}
