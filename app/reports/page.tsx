'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Reports() {
  const [students, setStudents] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [selectedClass, setSelectedClass] = useState('All')

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

  const uniqueClasses = [...new Set(students.map(s => s.class).filter(Boolean))].sort() as string[]
  const filtered = selectedClass === 'All' ? students : students.filter(s => s.class === selectedClass)

  // Stats computed from filtered set
  const totalExpected = filtered.reduce((s, st) => s + st.feeRequired, 0)
  const totalCollected = filtered.reduce((s, st) => s + (st.payments || []).reduce((p: number, pay: any) => p + pay.amount, 0), 0)
  const totalBalance = totalExpected - totalCollected
  const rate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
  const fullyPaid = filtered.filter(s => s.feeRequired - (s.payments || []).reduce((p: number, pay: any) => p + pay.amount, 0) <= 0).length
  const partialPaid = filtered.filter(s => { const p = (s.payments || []).reduce((sum: number, pay: any) => sum + pay.amount, 0); return p > 0 && p < s.feeRequired }).length
  const unpaid = filtered.filter(s => (s.payments || []).reduce((p: number, pay: any) => p + pay.amount, 0) === 0).length

  async function downloadReport() {
    setDownloading(true)
    try {
      const url = selectedClass === 'All'
        ? '/api/report'
        : `/api/report?class=${encodeURIComponent(selectedClass)}`
      const res = await fetch(url)
      if (!res.ok) return
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = selectedClass === 'All'
        ? 'fee_report.xlsx'
        : `fee_report_${selectedClass.replace(/\s+/g, '_')}.xlsx`
      a.click()
      URL.revokeObjectURL(href)
    } finally { setDownloading(false) }
  }

  async function printReport() {
    if (!filtered.length || !school) return
    setPrinting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // ── Constants ─────────────────────────────────────────────────────
      const PW = 210
      const L  = 12
      const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      const term  = school.currentTerm || ''

      // Column widths (sum = 186mm exactly)
      const cols = { no: 10, name: 60, admNo: 22, feeReq: 26, paid: 26, balance: 24, status: 18 }
      // Column x positions (left edge of each column, from left margin 12)
      const x = { no: 12, name: 22, admNo: 82, feeReq: 104, paid: 130, balance: 156, status: 180 }

      function truncate(text: string, maxChars: number): string {
        if (!text) return ''
        return text.length > maxChars ? text.substring(0, maxChars - 2) + '..' : text
      }

      // Summary from filtered students
      const tStudents  = filtered.length
      const tExp  = filtered.reduce((s, st) => s + st.feeRequired, 0)
      const tColl = filtered.reduce((s, st) => s + (st.payments || []).reduce((p: number, pay: any) => p + pay.amount, 0), 0)
      const tRate = tExp > 0 ? Math.round((tColl / tExp) * 100) : 0

      // ── PAGE 1 — COVER PAGE ──────────────────────────────────────────
      // School name
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(10, 31, 78)
      doc.text(school.name, PW / 2, 60, { align: 'center' })

      // Report title
      doc.setFont('helvetica', 'normal'); doc.setFontSize(14); doc.setTextColor(100, 116, 139)
      doc.text('FEE COLLECTION REPORT', PW / 2, 75, { align: 'center' })

      // Term
      doc.setFontSize(12)
      doc.text(term, PW / 2, 85, { align: 'center' })

      // Date generated
      doc.setFontSize(10)
      doc.text('Generated: ' + today, PW / 2, 93, { align: 'center' })

      // Horizontal line
      doc.setDrawColor(200, 210, 230); doc.setLineWidth(0.5)
      doc.line(L, 100, PW - 12, 100)

      // Summary stats — 2×2 grid, centered
      const statBoxW = 70; const statBoxH = 28; const statGap = 10
      const statGridW = statBoxW * 2 + statGap
      const statStartX = (PW - statGridW) / 2
      const statStartY = 115
      ;[
        { label: 'Total Students',   value: String(tStudents) },
        { label: 'Collection Rate',  value: tRate + '%' },
        { label: 'Total Expected',   value: 'KES ' + tExp.toLocaleString() },
        { label: 'Total Collected',  value: 'KES ' + tColl.toLocaleString() },
      ].forEach((stat, i) => {
        const col = i % 2; const row = Math.floor(i / 2)
        const bx = statStartX + col * (statBoxW + statGap)
        const by = statStartY + row * (statBoxH + statGap)
        doc.setFillColor(248, 249, 252); doc.setDrawColor(220, 228, 240); doc.setLineWidth(0.3)
        doc.rect(bx, by, statBoxW, statBoxH, 'FD')
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139)
        doc.text(stat.label.toUpperCase(), bx + statBoxW / 2, by + 9, { align: 'center' })
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(10, 31, 78)
        doc.text(stat.value, bx + statBoxW / 2, by + 20, { align: 'center' })
      })

      if (selectedClass !== 'All') {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139)
        doc.text('Filtered by class: ' + selectedClass, PW / 2, statStartY + 2 * (statBoxH + statGap) + 12, { align: 'center' })
      }

      // "Generated by FeeTracker" at bottom of cover
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(148, 163, 184)
      doc.text('Generated by FeeTracker', PW / 2, 270, { align: 'center' })

      // ── DATA PAGES — ONE CLASS PER PAGE ─────────────────────────────
      const classGroups: string[] = selectedClass === 'All'
        ? ([...new Set(filtered.map((s: any) => s.class).filter(Boolean))].sort() as string[])
        : [selectedClass]

      // Column headers helper (returns new y after drawing)
      function drawColHeaders(startY: number): number {
        doc.setFillColor(240, 243, 248)
        doc.rect(L, startY, 186, 7, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(100, 116, 139)
        doc.text('#',            x.no + cols.no / 2,            startY + 5, { align: 'center' })
        doc.text('STUDENT NAME', x.name + 1,                    startY + 5)
        doc.text('ADM NO',       x.admNo + 1,                   startY + 5)
        doc.text('FEE REQUIRED', x.feeReq + cols.feeReq - 2,    startY + 5, { align: 'right' })
        doc.text('AMOUNT PAID',  x.paid + cols.paid - 2,         startY + 5, { align: 'right' })
        doc.text('BALANCE',      x.balance + cols.balance - 2,   startY + 5, { align: 'right' })
        doc.text('STATUS',       x.status + cols.status / 2,     startY + 5, { align: 'center' })
        return startY + 7
      }

      for (const cls of classGroups) {
        const classStudents = filtered.filter((s: any) => s.class === cls)
        if (!classStudents.length) continue

        const clsExp  = classStudents.reduce((s: number, st: any) => s + st.feeRequired, 0)
        const clsColl = classStudents.reduce((s: number, st: any) => s + (st.payments || []).reduce((p: number, pay: any) => p + pay.amount, 0), 0)
        const clsRate = clsExp > 0 ? Math.round(clsColl / clsExp * 100) : 0

        // Each class starts on its own new page
        doc.addPage()
        let cy = 15

        // Class header bar (navy, white text)
        doc.setFillColor(10, 31, 78)
        doc.rect(L, cy, 186, 10, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255)
        doc.text(`${cls}  —  ${classStudents.length} students`, x.name, cy + 7)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
        doc.text(
          `Expected: KES ${clsExp.toLocaleString()}  ·  Collected: KES ${clsColl.toLocaleString()}  ·  Rate: ${clsRate}%`,
          PW - 13, cy + 7, { align: 'right' }
        )
        cy += 10

        cy = drawColHeaders(cy)

        // Student rows
        classStudents.forEach((student: any, i: number) => {
          // Page break: if next row would go past usable height
          if (cy + 7 > 272) {
            doc.addPage()
            cy = 15
            cy = drawColHeaders(cy)
          }

          const paid = (student.payments || []).reduce((s: number, p: any) => s + p.amount, 0)
          const bal  = student.feeRequired - paid
          const status = bal <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'

          // Alternating row background
          const even = i % 2 === 0
          doc.setFillColor(even ? 255 : 248, even ? 255 : 249, even ? 255 : 252)
          doc.rect(L, cy, 186, 7, 'F')

          const ty = cy + 5

          // No. — center aligned
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148, 163, 184)
          doc.text(String(i + 1), x.no + cols.no / 2, ty, { align: 'center' })

          // Name — left aligned, truncated to 28 chars
          doc.setTextColor(15, 23, 42)
          doc.text(truncate(student.name || '', 28), x.name, ty)

          // Adm No — left aligned, truncated to 11 chars
          doc.setTextColor(100, 116, 139)
          doc.text(truncate(student.admNo || '—', 11), x.admNo, ty)

          // Fee Required — right aligned
          doc.setTextColor(100, 116, 139)
          doc.text(student.feeRequired.toLocaleString(), x.feeReq + cols.feeReq - 2, ty, { align: 'right' })

          // Amount Paid — right aligned
          doc.setTextColor(10, 31, 78)
          doc.text(paid.toLocaleString(), x.paid + cols.paid - 2, ty, { align: 'right' })

          // Balance — right aligned, coloured
          doc.setFont('helvetica', bal > 0 ? 'bold' : 'normal')
          doc.setTextColor(
            bal > 0 ? 163 : 10,
            bal > 0 ? 45  : 124,
            bal > 0 ? 45  : 78
          )
          doc.text(bal.toLocaleString(), x.balance + cols.balance - 2, ty, { align: 'right' })

          // Status — center aligned, coloured text
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5)
          if (status === 'Paid')    doc.setTextColor(15, 110, 86)
          else if (status === 'Partial') doc.setTextColor(133, 79, 11)
          else                      doc.setTextColor(163, 45, 45)
          doc.text(status, x.status + cols.status / 2, ty, { align: 'center' })

          cy += 7
        })

        // Subtotal row (navy bg, white text) at end of class
        if (cy + 8 > 272) {
          doc.addPage()
          cy = 15
        }
        doc.setFillColor(10, 31, 78)
        doc.rect(L, cy, 186, 8, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255)
        doc.text(`${cls} TOTAL  —  ${classStudents.length} students`, x.name, cy + 5.5)
        doc.setTextColor(184, 134, 11)
        doc.text(clsExp.toLocaleString(),  x.feeReq + cols.feeReq - 2,   cy + 5.5, { align: 'right' })
        doc.setTextColor(255, 255, 255)
        doc.text(clsColl.toLocaleString(), x.paid + cols.paid - 2,         cy + 5.5, { align: 'right' })
        doc.text((clsExp - clsColl).toLocaleString(), x.balance + cols.balance - 2, cy + 5.5, { align: 'right' })
        doc.text(clsRate + '%',            x.status + cols.status / 2,     cy + 5.5, { align: 'center' })
      }

      // ── FOOTER ON EVERY PAGE ─────────────────────────────────────────
      const totalPages = (doc as any).internal.getNumberOfPages()
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p)
        doc.setDrawColor(200, 210, 230); doc.setLineWidth(0.3)
        doc.line(L, 284, PW - 12, 284)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139)
        doc.text(school.name,             L,        290)
        doc.text(`Page ${p} of ${totalPages}`, PW / 2, 290, { align: 'center' })
        doc.text('Generated by FeeTracker', PW - 12, 290, { align: 'right' })
      }

      const filename = selectedClass === 'All'
        ? `Fee_Report_${term.replace(/\s+/g, '_')}.pdf`
        : `Fee_Report_${selectedClass.replace(/\s+/g, '_')}_${term.replace(/\s+/g, '_')}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('PDF generation error:', err)
    }
    setPrinting(false)
  }

  // ── Display class label helpers ───────────────────────────────────────
  const displayClasses = selectedClass === 'All'
    ? uniqueClasses
    : uniqueClasses.filter(c => c === selectedClass)

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 640px) {
          .rpt-header { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; padding: 16px !important; }
          .rpt-header-right { flex-direction: column !important; align-items: stretch !important; width: 100% !important; }
          .rpt-filter-row { flex-direction: column !important; align-items: stretch !important; }
          .rpt-filter-row select { width: 100% !important; }
          .rpt-header-right button, .rpt-header-right a { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
          .rpt-content { padding: 16px !important; }
          .rpt-grid4 { grid-template-columns: 1fr 1fr !important; }
          .rpt-grid3 { grid-template-columns: 1fr !important; }
          .rpt-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
        @media (max-width: 380px) {
          .rpt-grid4 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <div className="rpt-header" style={{ background: '#0a1f4e', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', margin: 0 }}>Reports</h1>
          <p style={{ fontSize: '12px', color: '#94a3c8', margin: '4px 0 0' }}>Fee collection summary · {school?.currentTerm || '—'}</p>
        </div>

        <div className="rpt-header-right" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
          {/* Class filter row */}
          <div className="rpt-filter-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: '#94a3c8', whiteSpace: 'nowrap' }}>Filter by class:</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.08)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '5px',
                padding: '7px 10px', fontSize: '12px', outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="All" style={{ background: '#0a1f4e' }}>All classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c} style={{ background: '#0a1f4e' }}>{c}</option>
              ))}
            </select>
          </div>

          {/* Action buttons row */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' as const, justifyContent: 'flex-end' }}>
            <button
              onClick={downloadReport}
              disabled={downloading || loading}
              style={{ background: downloading ? '#94a3b8' : '#0a3a7a', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '8px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: downloading || loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: downloading ? 0.6 : 1 }}
            >
              {downloading ? 'Downloading…' : selectedClass === 'All' ? 'Download Excel' : `Download Excel — ${selectedClass}`}
            </button>
            <button
              onClick={printReport}
              disabled={printing || loading}
              style={{ background: printing ? '#94a3b8' : '#c8a84b', color: '#0a1f4e', padding: '8px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: printing || loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {printing ? 'Generating…' : selectedClass === 'All' ? '⎙ Print PDF' : `⎙ Print PDF — ${selectedClass}`}
            </button>
            <Link href="/dashboard" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#94a3c8', padding: '8px 14px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rpt-content" style={{ padding: '24px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px', fontSize: '14px' }}>
            No students found{selectedClass !== 'All' ? ` in ${selectedClass}` : ''}.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="rpt-grid4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'Expected',        value: 'KES ' + totalExpected.toLocaleString(),  color: '#0f172a' },
                { label: 'Collected',       value: 'KES ' + totalCollected.toLocaleString(), color: '#0a1f4e' },
                { label: 'Outstanding',     value: 'KES ' + totalBalance.toLocaleString(),   color: '#c8a84b' },
                { label: 'Collection rate', value: rate + '%', color: rate >= 80 ? '#0a7c3e' : rate >= 50 ? '#92681a' : '#a32d2d' },
              ].map(card => (
                <div key={card.label} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
                  <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{card.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Status breakdown */}
            <div className="rpt-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Fully paid',     value: fullyPaid,   color: '#166534', bg: '#e1f5ee' },
                { label: 'Partial payment', value: partialPaid, color: '#92681a', bg: '#fef9ec' },
                { label: 'No payment',     value: unpaid,      color: '#e24b4a', bg: '#fcebeb' },
              ].map(card => (
                <div key={card.label} style={{ background: card.bg, borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{card.label}</p>
                </div>
              ))}
            </div>

            {/* Class breakdown tables */}
            {displayClasses.map(cls => {
              const classStudents = filtered.filter(s => s.class === cls)
              const clsExpected  = classStudents.reduce((s, st) => s + st.feeRequired, 0)
              const clsCollected = classStudents.reduce((s, st) => s + (st.payments || []).reduce((p: number, pay: any) => p + pay.amount, 0), 0)
              const clsRate      = clsExpected > 0 ? Math.round(clsCollected / clsExpected * 100) : 0
              return (
                <div key={cls} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8f9fc', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0a1f4e', margin: 0 }}>
                      {cls} <span style={{ fontWeight: 400, color: '#94a3b8' }}>· {classStudents.length} students</span>
                    </h2>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b', flexWrap: 'wrap' as const }}>
                      <span>Expected: <strong>KES {clsExpected.toLocaleString()}</strong></span>
                      <span>Collected: <strong style={{ color: '#0a7c3e' }}>KES {clsCollected.toLocaleString()}</strong></span>
                      <span style={{ background: clsRate >= 80 ? '#e1f5ee' : clsRate >= 50 ? '#fef9ec' : '#fcebeb', color: clsRate >= 80 ? '#166534' : clsRate >= 50 ? '#92681a' : '#a32d2d', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                        {clsRate}%
                      </span>
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
                          const paid = (student.payments || []).reduce((s: number, p: any) => s + p.amount, 0)
                          const bal  = student.feeRequired - paid
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
