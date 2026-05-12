'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function Unmatched() {
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<number | null>(null)
  const [search, setSearch] = useState<Record<number, string>>({})
  const [searchOpen, setSearchOpen] = useState<Record<number, boolean>>({})
  const [selected, setSelected] = useState<Record<number, any>>({})
  const searchRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [pr, sr] = await Promise.all([fetch('/api/unmatched'), fetch('/api/students')])
    const [pd, sd] = await Promise.all([pr.json(), sr.json()])
    setPayments(Array.isArray(pd) ? pd : [])
    setStudents(Array.isArray(sd) ? sd : [])
    setLoading(false)
  }

  async function assignPayment(paymentId: number) {
    const student = selected[paymentId]
    if (!student) return
    setAssigning(paymentId)
    await fetch('/api/unmatched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, studentId: student.id })
    })
    setPayments(prev => prev.filter(p => p.id !== paymentId))
    setSelected(prev => { const n = { ...prev }; delete n[paymentId]; return n })
    setSearch(prev => { const n = { ...prev }; delete n[paymentId]; return n })
    setAssigning(null)
  }

  async function autoMatchAll(pairs: { paymentId: number; studentId: number }[]) {
    for (const { paymentId, studentId } of pairs) {
      await fetch('/api/unmatched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, studentId })
      })
    }
    await fetchData()
  }

  function getSearchResults(paymentId: number) {
    const q = (search[paymentId] || '').toLowerCase().trim()
    if (!q) return []
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.admNo.toLowerCase().includes(q) ||
      (s.class || '').toLowerCase().includes(q)
    ).slice(0, 8)
  }

  // Auto-match candidates: mpesaRef exactly matches an admNo
  const autoMatchPairs = payments.flatMap(p => {
    if (!p.mpesaRef) return []
    const ref = p.mpesaRef.trim().toLowerCase()
    const match = students.find(s => s.admNo.trim().toLowerCase() === ref)
    return match ? [{ paymentId: p.id, studentId: match.id, paymentRef: p.mpesaRef, studentName: match.name }] : []
  })

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 640px) {
          .unm-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .unm-content { padding: 12px !important; }
          .unm-ref { font-size: 16px !important; }
          .unm-amount { font-size: 22px !important; }
        }
      `}</style>

      <div className="unm-header" style={{ background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px' }}>Unmatched Payments</h1>
          <p style={{ fontSize: '12px', color: '#94a3c8' }}>Manually assign payments that could not be matched automatically</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!loading && payments.length > 0 && (
            <span style={{ background: '#e24b4a', color: '#fff', fontSize: '11px', padding: '4px 12px', borderRadius: '999px', fontWeight: 700 }}>
              {payments.length} pending
            </span>
          )}
          <Link href="/dashboard" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none' }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="unm-content" style={{ padding: '24px 32px', maxWidth: '720px', width: '100%', boxSizing: 'border-box' as const }}>
        {loading && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>Loading...</div>}

        {!loading && payments.length === 0 && (
          <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>No unmatched payments</p>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>All payments have been matched to students.</p>
          </div>
        )}

        {/* Auto-match banner */}
        {!loading && autoMatchPairs.length > 0 && (
          <div style={{ background: '#e1f5ee', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#166534', margin: '0 0 2px' }}>
                {autoMatchPairs.length} payment{autoMatchPairs.length > 1 ? 's' : ''} can be auto-matched by admission number
              </p>
              <p style={{ fontSize: '12px', color: '#15803d', margin: 0 }}>
                {autoMatchPairs.map(p => `${p.paymentRef} → ${p.studentName}`).join(', ')}
              </p>
            </div>
            <button
              onClick={() => autoMatchAll(autoMatchPairs)}
              style={{ background: '#166534', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Match all now
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {payments.map(payment => {
            const sel = selected[payment.id]
            const results = getSearchResults(payment.id)
            const isOpen = searchOpen[payment.id]

            return (
              <div key={payment.id} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Payment header */}
                <div style={{ background: '#0a1f4e', padding: '14px 18px' }}>
                  {payment.mpesaRef && (
                    <p className="unm-ref" style={{ fontSize: '18px', fontWeight: 800, color: '#c8a84b', margin: '0 0 4px', fontFamily: 'monospace', letterSpacing: '1px', wordBreak: 'break-all' as const }}>
                      {payment.mpesaRef}
                    </p>
                  )}
                  <p className="unm-amount" style={{ fontSize: '26px', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
                    KES {payment.amount.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3c8', margin: 0, lineHeight: 1.5 }}>
                    <strong style={{ color: '#fff' }}>{payment.senderName || 'Unknown sender'}</strong>
                    {payment.senderPhone && <span> · {payment.senderPhone}</span>}
                    <span> · {new Date(payment.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </p>
                  {!payment.mpesaRef && (
                    <span style={{ background: '#fcebeb', color: '#a32d2d', fontSize: '10px', padding: '3px 10px', borderRadius: '999px', fontWeight: 600, marginTop: '8px', display: 'inline-block' }}>
                      No reference
                    </span>
                  )}
                </div>

                {/* Match section */}
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Match to student
                  </p>

                  {/* Search box */}
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={el => { searchRefs.current[payment.id] = el }}
                      type="text"
                      placeholder="Search by name, admission no, or class…"
                      value={search[payment.id] || ''}
                      onChange={e => {
                        setSearch(prev => ({ ...prev, [payment.id]: e.target.value }))
                        setSearchOpen(prev => ({ ...prev, [payment.id]: true }))
                        if (sel) setSelected(prev => { const n = { ...prev }; delete n[payment.id]; return n })
                      }}
                      onFocus={() => setSearchOpen(prev => ({ ...prev, [payment.id]: true }))}
                      style={{ width: '100%', border: '2px solid #0a1f4e', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}
                    />
                    {/* Dropdown */}
                    {isOpen && results.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 20, overflow: 'hidden', marginTop: '4px' }}>
                        {results.map(s => {
                          const paid = s.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
                          const balance = s.feeRequired - paid
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                setSelected(prev => ({ ...prev, [payment.id]: s }))
                                setSearch(prev => ({ ...prev, [payment.id]: s.name }))
                                setSearchOpen(prev => ({ ...prev, [payment.id]: false }))
                              }}
                              style={{ display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fc')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >
                              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{s.name}</div>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                Adm: {s.admNo} · {s.class}{s.stream ? ' ' + s.stream : ''} · Balance: KES {balance.toLocaleString()}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected student confirmation */}
                  {sel && (
                    <div style={{ marginTop: '12px', background: '#f0f7ff', border: '2px solid #0a1f4e', borderRadius: '8px', padding: '14px 16px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#0a1f4e', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Matched to</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>{sel.name}</p>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                        Adm: {sel.admNo} · {sel.class}{sel.stream ? ' ' + sel.stream : ''}
                        {' · '}
                        Balance: KES {(sel.feeRequired - (sel.payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0)).toLocaleString()}
                      </p>
                      <button
                        onClick={() => assignPayment(payment.id)}
                        disabled={assigning === payment.id}
                        style={{
                          marginTop: '12px', width: '100%', background: assigning === payment.id ? '#94a3b8' : '#c8a84b',
                          color: assigning === payment.id ? '#fff' : '#0a1f4e', border: 'none', padding: '12px',
                          borderRadius: '8px', fontSize: '14px', fontWeight: 800, cursor: assigning === payment.id ? 'not-allowed' : 'pointer',
                          letterSpacing: '0.3px'
                        }}
                      >
                        {assigning === payment.id ? 'Saving…' : `✓ Confirm — assign KES ${payment.amount.toLocaleString()} to ${sel.name}`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
