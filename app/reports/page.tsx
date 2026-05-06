'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Reports() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => {
        setStudents(data)
        setLoading(false)
      })
  }, [])

  async function downloadReport() {
    setDownloading(true)
    const res = await fetch('/api/report')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fee_report.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
    setDownloading(false)
  }

  const totalExpected = students.reduce((sum, s) => sum + s.feeRequired, 0)
  const totalCollected = students.reduce((sum, s) => sum + s.payments.reduce((p: number, pay: any) => p + pay.amount, 0), 0)
  const totalBalance = totalExpected - totalCollected
  const fullyPaid = students.filter(s => s.feeRequired - s.payments.reduce((p: number, pay: any) => p + pay.amount, 0) <= 0).length
  const partial = students.filter(s => {
    const p = s.payments.reduce((sum: number, pay: any) => sum + pay.amount, 0)
    return p > 0 && p < s.feeRequired
  }).length
  const unpaid = students.filter(s => s.payments.length === 0).length

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif'}}>
      <style>{`
        @media (max-width: 640px) {
          .rpt-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .rpt-content { padding: 16px !important; }
          .rpt-grid-3 { grid-template-columns: repeat(1, 1fr) !important; }
          .rpt-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

      <div className="rpt-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px'}}>Reports</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>Fee collection summary for this term</p>
        </div>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <button
            onClick={downloadReport}
            disabled={downloading}
            style={{
              background: downloading ? '#94a3b8' : '#c8a84b',
              color: '#0a1f4e', padding: '8px 16px', borderRadius: '5px', fontSize: '12px',
              fontWeight: 700, border: 'none', cursor: downloading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap'
            }}
          >
            {downloading ? 'Downloading...' : 'Download Excel'}
          </button>
          <Link href="/dashboard" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="rpt-content" style={{padding: '24px 32px'}}>
        {loading ? (
          <div style={{textAlign: 'center', color: '#94a3b8', padding: '48px'}}>Loading...</div>
        ) : (
          <>
            <div className="rpt-grid-3" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px'}}>
              {[
                {label: 'Expected', value: 'KES ' + totalExpected.toLocaleString(), color: '#0f172a'},
                {label: 'Collected', value: 'KES ' + totalCollected.toLocaleString(), color: '#0a1f4e'},
                {label: 'Outstanding', value: 'KES ' + totalBalance.toLocaleString(), color: '#c8a84b'},
              ].map(card => (
                <div key={card.label} style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px'}}>
                  <p style={{fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px'}}>{card.label}</p>
                  <p style={{fontSize: '22px', fontWeight: 700, color: card.color}}>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="rpt-grid-3" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px'}}>
              {[
                {label: 'Fully paid', value: fullyPaid, color: '#0a1f4e', bg: '#e1f5ee'},
                {label: 'Partial payment', value: partial, color: '#92681a', bg: '#fef9ec'},
                {label: 'No payment', value: unpaid, color: '#e24b4a', bg: '#fcebeb'},
              ].map(card => (
                <div key={card.label} style={{background: card.bg, borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center'}}>
                  <p style={{fontSize: '28px', fontWeight: 700, color: card.color}}>{card.value}</p>
                  <p style={{fontSize: '11px', color: '#94a3b8', marginTop: '4px'}}>{card.label}</p>
                </div>
              ))}
            </div>

            <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
              <div style={{padding: '14px 16px', borderBottom: '1px solid #f1f5f9'}}>
                <h2 style={{fontSize: '13px', fontWeight: 700, color: '#0f172a'}}>Student breakdown</h2>
              </div>
              <div className="rpt-table-wrap">
                <table style={{width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px'}}>
                  <thead>
                    <tr style={{textAlign: 'left' as const, borderBottom: '1px solid #f1f5f9'}}>
                      {['Name', 'Class', 'Fee Required', 'Paid', 'Balance', 'Status'].map(h => (
                        <th key={h} style={{padding: '10px 14px', color: '#94a3b8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const paid = student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
                      const balance = student.feeRequired - paid
                      const status = balance <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'
                      const statusStyle = status === 'Paid'
                        ? {background: '#e1f5ee', color: '#0a1f4e'}
                        : status === 'Partial'
                        ? {background: '#fef9ec', color: '#92681a'}
                        : {background: '#fcebeb', color: '#a32d2d'}
                      return (
                        <tr key={student.id} style={{borderBottom: '1px solid #f8fafc'}}>
                          <td style={{padding: '10px 14px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap'}}>{student.name}</td>
                          <td style={{padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap'}}>{student.class} {student.stream}</td>
                          <td style={{padding: '10px 14px', whiteSpace: 'nowrap'}}>KES {student.feeRequired.toLocaleString()}</td>
                          <td style={{padding: '10px 14px', color: '#0a1f4e', fontWeight: 600, whiteSpace: 'nowrap'}}>KES {paid.toLocaleString()}</td>
                          <td style={{padding: '10px 14px', color: balance > 0 ? '#e24b4a' : '#64748b', whiteSpace: 'nowrap'}}>KES {balance.toLocaleString()}</td>
                          <td style={{padding: '10px 14px'}}>
                            <span style={{...statusStyle, fontSize: '10px', padding: '3px 8px', borderRadius: '999px', fontWeight: 600}}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
