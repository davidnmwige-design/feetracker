'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Reminders() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => {
        setStudents(data)
        setLoading(false)
      })
  }, [])

  function getPaid(student: any) {
    return student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
  }

  function getBalance(student: any) {
    return student.feeRequired - getPaid(student)
  }

  function getMessage(student: any) {
    const balance = getBalance(student)
    const balanceStr = balance.toLocaleString()
    const name = student.parentName || 'Parent'
    const studentName = student.name
    const cls = student.class + ' ' + student.stream
    return 'Dear ' + name + ', this is a reminder that ' + studentName + ' (' + cls + ') has an outstanding fee balance of KES ' + balanceStr + ' for this term. Please make payment to our MPESA paybill at your earliest convenience. Thank you. - FeeTracker'
  }

  function copyMessage(id: number, msg: string) {
    navigator.clipboard.writeText(msg)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const withBalance = students.filter(s => getBalance(s) > 0)
  const totalOutstanding = withBalance.reduce((sum, s) => sum + getBalance(s), 0)

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif'}}>
      <style>{`
        @media (max-width: 640px) {
          .rem-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .rem-content { padding: 16px !important; }
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
          <button
            onClick={() => {
              withBalance.forEach((student, i) => {
                const msg = getMessage(student)
                const phone = '254' + student.parentPhone.replace(/^0/, '')
                const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg)
                setTimeout(() => window.open(url, '_blank'), i * 1500)
              })
            }}
            style={{background: '#0a1f4e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '20px'}}
          >
            Send WhatsApp to all {withBalance.length} parents
          </button>
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

                <div style={{display: 'flex', gap: '8px'}}>
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
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
