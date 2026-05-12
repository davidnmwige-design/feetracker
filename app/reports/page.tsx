'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Reports() {
  const [students, setStudents] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/students').then(r => r.json()),
      fetch('/api/school').then(r => r.json()),
    ]).then(([s, sc]) => {
      setStudents(Array.isArray(s) ? s : [])
      setSchool(sc)
      setLoading(false)
    })
  }, [])

  async function downloadReport() {
    setDownloading(true)
    try {
      const res = await fetch('/api/report')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'fee_report.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  async function printReport() {
    if (!students.length || !school) return
    setPrinting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210
      const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      const term = school.currentTerm || ''

      // ── Header ──────────────────────────────────────────────────────
      doc.setFillColor(10, 31, 78)
      doc.rect(0, 0, W, 38, 'F')
      doc.setFillColor(200, 168, 75)
      doc.rect(0, 38, W, 2, 'F')

      doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(200, 168, 75)
      doc.text(school.name.toUpperCase(), W / 2, 14, { align: 'center' })

      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(170, 195, 225)
      doc.setCharSpace(2); doc.text('FEE COLLECTION REPORT', W / 2, 22, { align: 'center' }); doc.setCharSpace(0)
      doc.setFontSize(9); doc.text(term, W / 2, 31, { align: 'center' })

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148, 163, 184)
      doc.text('Generated: ' + today, W - 14, 10, { align: 'right' })

      // ── Summary ─────────────────────────────────────────────────────
      const totalExpected = students.reduce((s, st) => s + st.feeRequired, 0)
      const totalCollected = students.reduce((s, st) => s + st.payments.reduce((p: number, pay: any) => p + pay.amount, 0), 0)
      const outstanding = totalExpected - totalCollected
      const rate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

      const boxes = [
        { label: 'Total Expected', value: 'KES ' + totalExpected.toLocaleString() },
        { label: 'Total Collected', value: 'KES ' + totalCollected.toLocaleString() },
        { label: 'Outstanding', value: 'KES ' + outstanding.toLocaleString() },
        { label: 'Collection Rate', value: rate + '%' },
      ]
      const boxW = (W - 28) / 4; const boxY = 46
      boxes.forEach((box, i) => {
        const x = 14 + i * (boxW + 2)
        doc.setFillColor(248, 249, 252); doc.setDrawColor(220, 228, 240); doc.setLineWidth(0.2)
        doc.rect(x, boxY, boxW, 18, 'FD')
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 116, 139)
        doc.text(box.label.toUpperCase(), x + boxW / 2, boxY + 5.5, { align: 'center' })
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
        doc.setTextColor(10, 31, 78)
        doc.text(box.value, x + boxW / 2, boxY + 13, { align: 'center' })
      })

      // ── Class breakdown ─────────────────────────────────────────────
      const classes = [...new Set(students.map(s => s.class).filter(Boolean))].sort()
      let y = boxY + 24

      const COL = { name: 14, admNo: 66, paid: 118, balance: 148, status: 176 }

      function drawTableHeader() {
        doc.setFillColor(10, 31, 78)
        doc.rect(14, y, W - 28, 7, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(200, 168, 75)
        doc.text('STUDENT NAME', COL.name + 2, y + 4.8)
        doc.text('ADM NO', COL.admNo + 2, y + 4.8)
        doc.text('FEE REQ', COL.paid - 14, y + 4.8)
        doc.text('PAID', COL.paid + 2, y + 4.8)
        doc.text('BALANCE', COL.balance + 2, y + 4.8)
        doc.text('STATUS', COL.status + 2, y + 4.8)
        y += 7
      }

      function checkPageBreak(needed = 8) {
        if (y + needed > 278) {
          doc.addPage()
          y = 14
          drawTableHeader()
        }
      }

      for (const cls of classes) {
        const classStudents = students.filter(s => s.class === cls)
        const clsExpected = classStudents.reduce((s, st) => s + st.feeRequired, 0)
        const clsCollected = classStudents.reduce((s, st) => s + st.payments.reduce((p: number, pay: any) => p + pay.amount, 0), 0)

        checkPageBreak(14)

        // Class heading
        doc.setFillColor(232, 236, 248)
        doc.rect(14, y, W - 28, 7, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(10, 31, 78)
        doc.text(cls.toUpperCase() + '  —  ' + classStudents.length + ' students', COL.name + 2, y + 5)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(71, 85, 105)
        doc.text('Expected: KES ' + clsExpected.toLocaleString() + '   Collected: KES ' + clsCollected.toLocaleString() + '   Rate: ' + (clsExpected > 0 ? Math.round(clsCollected / clsExpected * 100) : 0) + '%', W - 15, y + 5, { align: 'right' })
        y += 7

        drawTableHeader()

        classStudents.forEach((student, i) => {
          checkPageBreak(7)
          const paid = student.payments.reduce((s: number, p: any) => s + p.amount, 0)
          const bal = student.feeRequired - paid
          const status = bal <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'

          doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252)
          doc.rect(14, y, W - 28, 6.5, 'F')

          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(15, 23, 42)
          doc.text(student.name, COL.name + 2, y + 4.5, { maxWidth: 48 })
          doc.setTextColor(71, 85, 105)
          doc.text(student.admNo || '—', COL.admNo + 2, y + 4.5)
          doc.text('KES ' + student.feeRequired.toLocaleString(), COL.paid - 14 + 2, y + 4.5)
          doc.setTextColor(10, 31, 78)
          doc.text('KES ' + paid.toLocaleString(), COL.paid + 2, y + 4.5)
          doc.setTextColor(bal > 0 ? 226 : 10, bal > 0 ? 75 : 124, bal > 0 ? 74 : 78)
          doc.text('KES ' + bal.toLocaleString(), COL.balance + 2, y + 4.5)

          // Status pill
          const sc = status === 'Paid' ? [225, 245, 238] : status === 'Partial' ? [254, 249, 236] : [252, 235, 235]
          const tc = status === 'Paid' ? [22, 101, 52] : status === 'Partial' ? [146, 104, 26] : [163, 45, 45]
          doc.setFillColor(sc[0], sc[1], sc[2])
          doc.roundedRect(COL.status + 2, y + 1.5, 20, 4, 1, 1, 'F')
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(tc[0], tc[1], tc[2])
          doc.text(status, COL.status + 12, y + 4.5, { align: 'center' })

          y += 6.5
        })

        // Class subtotal row
        doc.setDrawColor(200, 210, 230); doc.setLineWidth(0.2)
        doc.line(14, y, W - 14, y)
        y += 5
      }

      // ── Footer ─────────────────────────────────────────────────────
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p)
        doc.setFillColor(10, 31, 78)
        doc.rect(0, 284, W, 13, 'F')
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(148, 163, 184)
        doc.text(school.name + '  ·  ' + term + '  ·  Generated by FeeTracker', W / 2, 291, { align: 'center' })
        doc.text('Page ' + p + ' of ' + pageCount, W - 14, 291, { align: 'right' })
      }

      doc.save(`Fee_Report_${term.replace(/\s+/g, '_')}_${today.replace(/\s+/g, '_')}.pdf`)
    } catch (err) {
      console.error('PDF generation error:', err)
    }
    setPrinting(false)
  }

  const totalExpected = students.reduce((s, st) => s + st.feeRequired, 0)
  const totalCollected = students.reduce((s, st) => s + st.payments.reduce((p: number, pay: any) => p + pay.amount, 0), 0)
  const totalBalance = totalExpected - totalCollected
  const rate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
  const fullyPaid = students.filter(s => s.feeRequired - s.payments.reduce((p: number, pay: any) => p + pay.amount, 0) <= 0).length
  const partial = students.filter(s => { const p = s.payments.reduce((sum: number, pay: any) => sum + pay.amount, 0); return p > 0 && p < s.feeRequired }).length
  const unpaid = students.filter(s => s.payments.length === 0).length

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 640px) {
          .rpt-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .rpt-header-actions { flex-direction: column !important; width: 100% !important; }
          .rpt-header-actions button, .rpt-header-actions a { width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
          .rpt-content { padding: 16px !important; }
          .rpt-grid { grid-template-columns: 1fr 1fr !important; }
          .rpt-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
        @media (max-width: 400px) {
          .rpt-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="rpt-header" style={{ background: '#0a1f4e', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', margin: 0 }}>Reports</h1>
          <p style={{ fontSize: '12px', color: '#94a3c8', margin: '4px 0 0' }}>Fee collection summary · {school?.currentTerm || '—'}</p>
        </div>
        <div className="rpt-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={printReport} disabled={printing || loading}
            style={{ background: printing ? '#94a3b8' : '#c8a84b', color: '#0a1f4e', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: printing || loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {printing ? 'Generating…' : '⎙ Print PDF'}
          </button>
          <button onClick={downloadReport} disabled={downloading}
            style={{ background: 'none', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', cursor: downloading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: downloading ? 0.6 : 1 }}>
            {downloading ? 'Downloading…' : 'Download Excel'}
          </button>
          <Link href="/dashboard" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#94a3c8', padding: '8px 14px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="rpt-content" style={{ padding: '24px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>Loading...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="rpt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Expected', value: 'KES ' + totalExpected.toLocaleString(), color: '#0f172a' },
                { label: 'Collected', value: 'KES ' + totalCollected.toLocaleString(), color: '#0a1f4e' },
                { label: 'Outstanding', value: 'KES ' + totalBalance.toLocaleString(), color: '#c8a84b' },
                { label: 'Collection rate', value: rate + '%', color: rate >= 80 ? '#0a7c3e' : rate >= 50 ? '#92681a' : '#a32d2d' },
              ].map(card => (
                <div key={card.label} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{card.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            <div className="rpt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Fully paid', value: fullyPaid, color: '#166534', bg: '#e1f5ee' },
                { label: 'Partial payment', value: partial, color: '#92681a', bg: '#fef9ec' },
                { label: 'No payment', value: unpaid, color: '#e24b4a', bg: '#fcebeb' },
              ].map(card => (
                <div key={card.label} style={{ background: card.bg, borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{card.label}</p>
                </div>
              ))}
            </div>

            {/* Breakdown by class */}
            {[...new Set(students.map(s => s.class).filter(Boolean))].sort().map(cls => {
              const classStudents = students.filter(s => s.class === cls)
              const clsExpected = classStudents.reduce((s, st) => s + st.feeRequired, 0)
              const clsCollected = classStudents.reduce((s, st) => s + st.payments.reduce((p: number, pay: any) => p + pay.amount, 0), 0)
              const clsRate = clsExpected > 0 ? Math.round(clsCollected / clsExpected * 100) : 0
              return (
                <div key={cls} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8f9fc', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0a1f4e', margin: 0 }}>{cls} <span style={{ fontWeight: 400, color: '#94a3b8' }}>· {classStudents.length} students</span></h2>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                      <span>Expected: <strong>KES {clsExpected.toLocaleString()}</strong></span>
                      <span>Collected: <strong style={{ color: '#0a7c3e' }}>KES {clsCollected.toLocaleString()}</strong></span>
                      <span style={{ background: clsRate >= 80 ? '#e1f5ee' : clsRate >= 50 ? '#fef9ec' : '#fcebeb', color: clsRate >= 80 ? '#166534' : clsRate >= 50 ? '#92681a' : '#a32d2d', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>{clsRate}%</span>
                    </div>
                  </div>
                  <div className="rpt-table-wrap" style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px', minWidth: '480px' }}>
                      <thead>
                        <tr style={{ textAlign: 'left' as const, borderBottom: '1px solid #f1f5f9' }}>
                          {['Name', 'Adm No', 'Fee Req', 'Paid', 'Balance', 'Status'].map(h => (
                            <th key={h} style={{ padding: '8px 14px', color: '#94a3b8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map(student => {
                          const paid = student.payments.reduce((s: number, p: any) => s + p.amount, 0)
                          const bal = student.feeRequired - paid
                          const status = bal <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'
                          const st = status === 'Paid' ? { bg: '#e1f5ee', c: '#166534' } : status === 'Partial' ? { bg: '#fef9ec', c: '#92681a' } : { bg: '#fcebeb', c: '#a32d2d' }
                          return (
                            <tr key={student.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '9px 14px', fontWeight: 600, color: '#0f172a' }}>{student.name}</td>
                              <td style={{ padding: '9px 14px', color: '#64748b' }}>{student.admNo || '—'}</td>
                              <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>KES {student.feeRequired.toLocaleString()}</td>
                              <td style={{ padding: '9px 14px', color: '#0a7c3e', fontWeight: 600, whiteSpace: 'nowrap' }}>KES {paid.toLocaleString()}</td>
                              <td style={{ padding: '9px 14px', color: bal > 0 ? '#e24b4a' : '#64748b', fontWeight: bal > 0 ? 600 : 400, whiteSpace: 'nowrap' }}>KES {bal.toLocaleString()}</td>
                              <td style={{ padding: '9px 14px' }}>
                                <span style={{ background: st.bg, color: st.c, fontSize: '10px', padding: '3px 8px', borderRadius: '999px', fontWeight: 600 }}>{status}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
