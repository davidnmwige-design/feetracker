'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Unmatched() {
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<number | null>(null)
  const [selected, setSelected] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [paymentsRes, studentsRes] = await Promise.all([
      fetch('/api/unmatched'),
      fetch('/api/students')
    ])
    const paymentsData = await paymentsRes.json()
    const studentsData = await studentsRes.json()
    setPayments(paymentsData)
    setStudents(studentsData)
    setLoading(false)
  }

  async function assignPayment(paymentId: number) {
    const studentId = selected[paymentId]
    if (!studentId) return
    setAssigning(paymentId)
    await fetch('/api/unmatched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, studentId: Number(studentId) })
    })
    await fetchData()
    setAssigning(null)
  }

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif'}}>
      <style>{`
        @media (max-width: 640px) {
          .unm-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .unm-content { padding: 16px !important; }
          .unm-assign-row { flex-direction: column !important; }
          .unm-assign-row select { width: 100% !important; }
        }
      `}</style>

      <div className="unm-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px'}}>Unmatched Payments</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>Manually assign payments that could not be matched automatically</p>
        </div>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          {!loading && payments.length > 0 && (
            <span style={{background: '#e24b4a', color: '#fff', fontSize: '11px', padding: '4px 12px', borderRadius: '999px', fontWeight: 700}}>
              {payments.length} pending
            </span>
          )}
          <Link href="/dashboard" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="unm-content" style={{padding: '24px 32px'}}>
        {loading && (
          <div style={{textAlign: 'center', color: '#94a3b8', padding: '48px'}}>Loading...</div>
        )}

        {!loading && payments.length === 0 && (
          <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '48px', textAlign: 'center'}}>
            <p style={{fontWeight: 600, color: '#0f172a', marginBottom: '4px'}}>No unmatched payments</p>
            <p style={{fontSize: '13px', color: '#94a3b8'}}>All payments have been matched to students.</p>
          </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {payments.map(payment => (
            <div key={payment.id} style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                <div>
                  <p style={{fontWeight: 700, color: '#0f172a', fontSize: '16px', marginBottom: '4px'}}>KES {payment.amount.toLocaleString()}</p>
                  <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '2px'}}>
                    From: {payment.senderName || 'Unknown'} · {payment.senderPhone || 'No phone'}
                  </p>
                  <p style={{fontSize: '12px', color: '#94a3b8'}}>
                    Ref: {payment.mpesaRef || '—'} · {new Date(payment.paidAt).toLocaleDateString('en-KE')}
                  </p>
                  {payment.mpesaRef && (
                    <div style={{marginTop: '8px', background: '#fef9ec', border: '1px solid #f0d878', borderRadius: '6px', padding: '10px 12px'}}>
                      <p style={{fontSize: '10px', color: '#92681a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px'}}>Account reference typed by parent</p>
                      <p style={{fontSize: '14px', fontWeight: 700, color: '#0f172a'}}>{payment.mpesaRef}</p>
                      <p style={{fontSize: '11px', color: '#92681a', marginTop: '2px'}}>Use this to identify the student — match to admission number or name</p>
                    </div>
                  )}
                </div>
                <span style={{background: '#fcebeb', color: '#a32d2d', fontSize: '10px', padding: '3px 10px', borderRadius: '999px', fontWeight: 600, whiteSpace: 'nowrap'}}>
                  Unmatched
                </span>
              </div>

              <div className="unm-assign-row" style={{display: 'flex', gap: '8px'}}>
                <select
                  style={{flex: 1, border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: '#0f172a', background: '#fff', outline: 'none'}}
                  value={selected[payment.id] || ''}
                  onChange={e => setSelected({ ...selected, [payment.id]: e.target.value })}
                >
                  <option value="">Select student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.class} {s.stream} · {s.admNo}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => assignPayment(payment.id)}
                  disabled={!selected[payment.id] || assigning === payment.id}
                  style={{
                    background: (!selected[payment.id] || assigning === payment.id) ? '#94a3b8' : '#0a1f4e',
                    color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                    border: 'none', cursor: (!selected[payment.id] || assigning === payment.id) ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {assigning === payment.id ? 'Saving...' : 'Assign'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
