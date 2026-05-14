'use client'
import { useState, useEffect, useRef } from 'react'

interface Payment {
  id: number
  mpesaRef: string | null
  amount: number
  paidAt: string
  senderName: string | null
  matched: boolean
  source: string
  student: { name: string; class: string } | null
}

const POLL_MS = 30_000

export default function LivePaymentsFeed() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [newIds, setNewIds] = useState<Set<number>>(new Set())
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const knownIds = useRef<Set<number>>(new Set())
  const initialized = useRef(false)

  async function fetchPayments() {
    try {
      const res = await fetch('/api/payments/recent')
      if (!res.ok) return
      const data = await res.json()
      const fresh: Payment[] = data.payments || []

      if (!initialized.current) {
        initialized.current = true
        fresh.forEach(p => knownIds.current.add(p.id))
        setPayments(fresh)
      } else {
        const added = fresh.filter(p => !knownIds.current.has(p.id))
        if (added.length > 0) {
          added.forEach(p => knownIds.current.add(p.id))
          setNewIds(prev => {
            const next = new Set(prev)
            added.forEach(p => next.add(p.id))
            return next
          })
          setTimeout(() => {
            setNewIds(prev => {
              const next = new Set(prev)
              added.forEach(p => next.delete(p.id))
              return next
            })
          }, 3000)
        }
        setPayments(fresh)
      }

      setLastFetched(new Date())
      setSecondsAgo(0)
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchPayments()
    const poll = setInterval(fetchPayments, POLL_MS)
    return () => clearInterval(poll)
  }, [])

  // Tick "X seconds ago" counter
  useEffect(() => {
    const tick = setInterval(() => {
      if (lastFetched) {
        setSecondsAgo(Math.floor((Date.now() - lastFetched.getTime()) / 1000))
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [lastFetched])

  return (
    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent payments</h2>
        {lastFetched && (
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
          </span>
        )}
      </div>

      <style>{`
        @keyframes flash-gold { 0%,100% { background: transparent; } 50% { background: rgba(200,168,75,0.25); } }
        .pay-row-new { animation: flash-gold 1s ease 3; }
        .dash-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>

      <div className="dash-table-wrap">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '560px' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
              {['Time', 'From', 'Amount', 'Matched to', 'Source', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  No payments yet. Upload an MPESA statement to get started.
                </td>
              </tr>
            )}
            {payments.map(p => (
              <tr
                key={p.id}
                className={newIds.has(p.id) ? 'pay-row-new' : ''}
                style={{ borderBottom: '1px solid #f8fafc' }}
              >
                <td style={{ padding: '10px 14px', color: '#64748b' }}>
                  {new Date(p.paidAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ padding: '10px 14px' }}>{p.senderName || '—'}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>KES {p.amount.toLocaleString()}</td>
                <td style={{ padding: '10px 14px', color: '#64748b' }}>
                  {p.student ? `${p.student.name} · ${p.student.class}` : '—'}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  {p.source === 'daraja' ? (
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: 700 }}>Live</span>
                  ) : (
                    <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: 600 }}>Upload</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ background: p.matched ? '#e1f5ee' : '#fcebeb', color: p.matched ? '#166534' : '#a32d2d', fontSize: '10px', padding: '3px 8px', borderRadius: '999px', fontWeight: 600 }}>
                    {p.matched ? 'Matched' : 'Review'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
