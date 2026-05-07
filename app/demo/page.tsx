'use client'
import { useState } from 'react'
import Link from 'next/link'

// ── Data ──────────────────────────────────────────────────────────────────────

const SCHOOL = { name: 'Westlands Academy', term: 'Term 2 2026', paybill: '522522' }

const STUDENTS = [
  { name: 'Brian Kamau',   admNo: 'WA/001', cls: 'Form 2 North', parent: 'Mary Kamau',    phone: '0722111001', fee: 45000, paid: 45000 },
  { name: 'Aisha Mwangi',  admNo: 'WA/002', cls: 'Form 2 North', parent: 'James Mwangi',  phone: '0722111002', fee: 45000, paid: 25000 },
  { name: 'Daniel Otieno', admNo: 'WA/003', cls: 'Form 2 South', parent: 'Grace Otieno',  phone: '0722111003', fee: 45000, paid: 0     },
  { name: 'Grace Njeri',   admNo: 'WA/004', cls: 'Form 3 North', parent: 'John Njeri',    phone: '0722111004', fee: 52000, paid: 52000 },
  { name: 'Kevin Ochieng', admNo: 'WA/005', cls: 'Form 3 South', parent: 'Peter Ochieng', phone: '0722111005', fee: 52000, paid: 10000 },
  { name: 'Fatuma Hassan', admNo: 'WA/006', cls: 'Form 4 East',  parent: 'Hassan Ali',    phone: '0722111006', fee: 58000, paid: 58000 },
  { name: 'Samuel Waweru', admNo: 'WA/007', cls: 'Form 4 West',  parent: 'Mary Waweru',   phone: '0722111007', fee: 58000, paid: 30000 },
  { name: 'Lydia Chebet',  admNo: 'WA/008', cls: 'Form 1 North', parent: 'David Chebet',  phone: '0722111008', fee: 42000, paid: 0     },
]

const PAYMENTS = [
  { time: 'Today 10:42',  from: 'Mary Kamau',   phone: '0722111001', amount: 45000, student: 'Brian Kamau',   cls: 'Form 2 North', matched: true  },
  { time: 'Today 09:15',  from: 'John Njeri',   phone: '0722111004', amount: 52000, student: 'Grace Njeri',   cls: 'Form 3 North', matched: true  },
  { time: 'Today 08:30',  from: 'Hassan Ali',   phone: '0722111006', amount: 58000, student: 'Fatuma Hassan', cls: 'Form 4 East',  matched: true  },
  { time: 'Yesterday',    from: 'James Mwangi', phone: '0722111002', amount: 25000, student: 'Aisha Mwangi',  cls: 'Form 2 North', matched: true  },
  { time: 'Yesterday',    from: '0701999001',   phone: '0701999001', amount: 5000,  student: '',               cls: '',             matched: false },
]

const NOTIFICATIONS = [
  { parent: 'Mary Kamau',   student: 'Brian Kamau',   cls: 'Form 2 North', amount: 45000, balance: 0,     waPhone: '254722111001' },
  { parent: 'John Njeri',   student: 'Grace Njeri',   cls: 'Form 3 North', amount: 52000, balance: 0,     waPhone: '254722111004' },
  { parent: 'Hassan Ali',   student: 'Fatuma Hassan', cls: 'Form 4 East',  amount: 58000, balance: 0,     waPhone: '254722111006' },
  { parent: 'James Mwangi', student: 'Aisha Mwangi',  cls: 'Form 2 North', amount: 25000, balance: 20000, waPhone: '254722111002' },
]

const REMINDERS = STUDENTS.filter(s => s.paid < s.fee).map(s => ({
  ...s,
  balance: s.fee - s.paid,
  waPhone: '254' + s.phone.slice(1),
  msg: `Dear ${s.parent}, this is a fee reminder from ${SCHOOL.name}. ${s.name} in ${s.cls} has an outstanding balance of KES ${(s.fee - s.paid).toLocaleString()} for ${SCHOOL.term}. Kindly settle at your earliest convenience. Thank you. — ${SCHOOL.name}`,
}))

const CERT_STUDENT = STUDENTS[0] // Brian Kamau — fully paid

// ── Shared components ─────────────────────────────────────────────────────────

function Badge({ paid, fee }: { paid: number; fee: number }) {
  const b = fee - paid
  if (b <= 0) return <span style={{ background: '#e1f5ee', color: '#0a7c4e', fontSize: '10px', padding: '3px 9px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' as const }}>Paid</span>
  if (paid > 0) return <span style={{ background: '#fef9ec', color: '#92600a', fontSize: '10px', padding: '3px 9px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' as const }}>Partial</span>
  return <span style={{ background: '#fcebeb', color: '#a32d2d', fontSize: '10px', padding: '3px 9px', borderRadius: '999px', fontWeight: 700, whiteSpace: 'nowrap' as const }}>Unpaid</span>
}

function CTA() {
  return (
    <div style={{ marginTop: '28px', background: '#0a1f4e', borderRadius: '10px', padding: '24px 32px', textAlign: 'center' as const }}>
      <p style={{ color: '#94a3c8', fontSize: '13px', margin: '0 0 14px' }}>Ready to run your school like this?</p>
      <Link href="/signup" style={{ display: 'inline-block', background: '#c8a84b', color: '#0a1f4e', padding: '13px 36px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}>
        Set up your school free →
      </Link>
    </div>
  )
}

// ── Tab 1: Dashboard ──────────────────────────────────────────────────────────

function TabDashboard() {
  return (
    <div>
      <div className="demo-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Expected',     value: 'KES 397,000', color: '#0f172a' },
          { label: 'Collected',    value: 'KES 230,000', color: '#0a1f4e' },
          { label: 'Outstanding',  value: 'KES 167,000', color: '#c8a84b' },
          { label: 'Zero payment', value: '2',           color: '#e24b4a' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 6px' }}>{c.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: c.color, margin: 0 }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Recent payments</h2>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>5 transactions</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px' }}>
            <thead>
              <tr style={{ textAlign: 'left' as const, borderBottom: '1px solid #f1f5f9' }}>
                {['Time', 'Sender', 'Amount', 'Matched to', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{p.time}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 500 }}>{p.from}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700 }}>KES {p.amount.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{p.matched ? `${p.student} · ${p.cls}` : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ background: p.matched ? '#e1f5ee' : '#fcebeb', color: p.matched ? '#166534' : '#a32d2d', fontSize: '10px', padding: '3px 8px', borderRadius: '999px', fontWeight: 600 }}>
                      {p.matched ? 'Matched' : 'Needs review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <CTA />
    </div>
  )
}

// ── Tab 2: Students ───────────────────────────────────────────────────────────

function TabStudents() {
  const [search, setSearch] = useState('')
  const q = search.toLowerCase()
  const filtered = STUDENTS.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.cls.toLowerCase().includes(q) ||
    s.parent.toLowerCase().includes(q) ||
    s.admNo.toLowerCase().includes(q)
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' as const, gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
          {[
            { label: 'Paid',    n: STUDENTS.filter(s => s.paid >= s.fee).length,             bg: '#e1f5ee', col: '#0a7c4e' },
            { label: 'Partial', n: STUDENTS.filter(s => s.paid > 0 && s.paid < s.fee).length, bg: '#fef9ec', col: '#92600a' },
            { label: 'Unpaid',  n: STUDENTS.filter(s => s.paid === 0).length,                 bg: '#fcebeb', col: '#a32d2d' },
          ].map(b => (
            <span key={b.label} style={{ background: b.bg, color: b.col, fontSize: '11px', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>
              {b.n} {b.label}
            </span>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search students, class, parent…"
          style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', outline: 'none', width: '230px', color: '#0f172a' }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '12px' }}>
          <thead>
            <tr style={{ textAlign: 'left' as const, borderBottom: '1px solid #e2e8f0', background: '#f8f9fc' }}>
              {['Adm No', 'Student', 'Class', 'Parent', 'Fee', 'Paid', 'Balance', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap' as const }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center' as const, color: '#94a3b8' }}>No results for "{search}"</td></tr>
            )}
            {filtered.map((s, i) => {
              const bal = s.fee - s.paid
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '11px' }}>{s.admNo}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>{s.name}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{s.cls}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{s.parent}</td>
                  <td style={{ padding: '10px 14px' }}>KES {s.fee.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', color: '#0a7c4e', fontWeight: 600 }}>KES {s.paid.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', color: bal > 0 ? '#e24b4a' : '#64748b', fontWeight: bal > 0 ? 600 : 400 }}>
                    {bal > 0 ? 'KES ' + bal.toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}><Badge paid={s.paid} fee={s.fee} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <CTA />
    </div>
  )
}

// ── Tab 3: Upload MPESA ───────────────────────────────────────────────────────

function TabUpload() {
  const [stage, setStage] = useState<'idle' | 'loading' | 'done'>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [hovered, setHovered] = useState(false)

  function simulate() {
    setStage('loading')
    setTimeout(() => setStage('done'), 1600)
  }

  if (stage === 'done') {
    return (
      <div>
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Upload results</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total',        v: '5', bg: '#f8f9fc', br: '#e2e8f0',  vc: '#0f172a' },
              { label: 'Matched',      v: '4', bg: '#f0f4f9', br: '#d4ddf0',  vc: '#0a1f4e' },
              { label: 'Needs review', v: '1', bg: '#fcebeb', br: '#f5c6c6',  vc: '#e24b4a' },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, border: '1px solid ' + c.br, borderRadius: '6px', padding: '14px', textAlign: 'center' as const }}>
                <p style={{ fontSize: '28px', fontWeight: 700, color: c.vc, margin: 0 }}>{c.v}</p>
                <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '4px 0 0' }}>{c.label}</p>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '0 0 10px' }}>
            WhatsApp notifications — 4 parents notified automatically
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '20px' }}>
            {NOTIFICATIONS.map((n, i) => {
              const msg = `Dear ${n.parent}, we have received KES ${n.amount.toLocaleString()} for ${n.student}, ${n.cls}. Outstanding balance: KES ${n.balance.toLocaleString()}. Thank you. — ${SCHOOL.name}`
              return (
                <div key={i} style={{ background: '#f8f9fc', borderLeft: '3px solid #c8a84b', padding: '10px 12px', borderRadius: '0 4px 4px 0' }}>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', margin: '0 0 8px' }}>{msg}</p>
                  <a
                    href={`https://wa.me/${n.waPhone}?text=${encodeURIComponent(msg)}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '11px', background: '#25D366', color: '#fff', padding: '3px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Open in WhatsApp
                  </a>
                </div>
              )
            })}
          </div>

          <div style={{ background: '#fcebeb', border: '1px solid #f5c6c6', borderRadius: '6px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px' }}>
            <p style={{ fontSize: '12px', color: '#a32d2d', margin: 0 }}>1 payment from <strong>0701999001</strong> (KES 5,000) could not be matched to a student.</p>
            <button onClick={() => setStage('idle')} style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 12px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>
              Simulate again
            </button>
          </div>
        </div>
        <CTA />
      </div>
    )
  }

  return (
    <div>
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '8px' }}>Statement type</label>
          <select style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', color: '#0f172a', background: '#fff', outline: 'none' }}>
            <option>MPESA (Safaricom)</option>
            <option>Equity Bank</option>
            <option>KCB Bank</option>
            <option>Co-operative Bank</option>
          </select>
        </div>

        <div style={{ background: '#f8f9fc', borderRadius: '6px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#64748b', borderLeft: '3px solid #c8a84b' }}>
          <strong style={{ color: '#0f172a' }}>How to get your MPESA statement:</strong> Log into the Safaricom Business portal → Transactions → select date range → Download as Excel or CSV.
        </div>

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => document.getElementById('demo-file')?.click()}
          style={{
            border: `2px dashed ${file ? '#0a1f4e' : hovered ? '#c8a84b' : '#e2e8f0'}`,
            borderRadius: '8px', padding: '32px', textAlign: 'center' as const,
            cursor: 'pointer', background: file ? '#f0f4f9' : '#fafbfc', transition: 'border-color 0.2s', marginBottom: '16px'
          }}
        >
          <input id="demo-file" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
          {file
            ? <><p style={{ fontWeight: 600, color: '#0a1f4e', fontSize: '14px', margin: 0 }}>{file.name}</p><p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>{(file.size / 1024).toFixed(1)} KB</p></>
            : <><p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Click to select a statement file</p><p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>Supports .xlsx, .xls, .csv</p></>
          }
        </div>

        <button
          onClick={simulate}
          disabled={stage === 'loading'}
          style={{ width: '100%', background: stage === 'loading' ? '#94a3b8' : '#0a1f4e', color: '#fff', padding: '11px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: stage === 'loading' ? 'not-allowed' : 'pointer' }}
        >
          {stage === 'loading' ? 'Processing statement…' : 'Simulate upload'}
        </button>
        <p style={{ textAlign: 'center' as const, fontSize: '11px', color: '#94a3b8', margin: '8px 0 0' }}>
          No file required — click Simulate to see results instantly
        </p>
      </div>
      <CTA />
    </div>
  )
}

// ── Tab 4: Reminders ──────────────────────────────────────────────────────────

function TabReminders() {
  const [sent, setSent] = useState<Record<string, boolean>>({})
  const [allSent, setAllSent] = useState(false)

  function sendOne(name: string) {
    setSent(p => {
      const updated = { ...p, [name]: true }
      if (Object.keys(updated).length === REMINDERS.length) setAllSent(true)
      return updated
    })
  }

  function sendAll() {
    const m: Record<string, boolean> = {}
    REMINDERS.forEach(r => { m[r.name] = true })
    setSent(m)
    setAllSent(true)
  }

  const sentCount = Object.values(sent).filter(Boolean).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '10px' }}>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          {REMINDERS.length} parents with outstanding balances
          {sentCount > 0 && <span style={{ color: '#0a7c4e', fontWeight: 600 }}> · {sentCount} reminded</span>}
        </p>
        {allSent ? (
          <span style={{ background: '#e1f5ee', color: '#0a7c4e', fontSize: '12px', padding: '7px 16px', borderRadius: '6px', fontWeight: 600 }}>
            ✓ All {REMINDERS.length} reminders sent
          </span>
        ) : (
          <button onClick={sendAll} style={{ background: '#0a1f4e', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            Send all reminders
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
        {REMINDERS.map((r, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{r.name}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>{r.cls}</span>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e24b4a' }}>KES {r.balance.toLocaleString()} outstanding</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.parent} · {r.phone}</div>
              </div>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600, margin: '0 0 6px' }}>WhatsApp message</p>
              <div style={{ background: '#f8f9fc', borderLeft: '3px solid #c8a84b', borderRadius: '0 6px 6px 0', padding: '10px 12px', fontSize: '12px', color: '#475569', lineHeight: '1.6', marginBottom: '10px' }}>
                {r.msg}
              </div>
              {sent[r.name]
                ? <span style={{ fontSize: '12px', color: '#0a7c4e', fontWeight: 600 }}>✓ Reminder sent to {r.parent}</span>
                : (
                  <a
                    href={`https://wa.me/${r.waPhone}?text=${encodeURIComponent(r.msg)}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => sendOne(r.name)}
                    style={{ display: 'inline-block', background: '#25D366', color: '#fff', padding: '7px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Send via WhatsApp
                  </a>
                )
              }
            </div>
          </div>
        ))}
      </div>
      <CTA />
    </div>
  )
}

// ── Tab 5: Certificate ────────────────────────────────────────────────────────

function TabCertificate() {
  const [generating, setGenerating] = useState(false)
  const s = CERT_STUDENT
  const today = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })

  async function download() {
    setGenerating(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210

      // Double border
      doc.setDrawColor(10, 31, 78); doc.setLineWidth(1.5); doc.rect(8, 8, W - 16, 281)
      doc.setLineWidth(0.4); doc.rect(11, 11, W - 22, 275)

      // Navy header
      doc.setFillColor(10, 31, 78); doc.rect(0, 0, W, 44, 'F')
      doc.setFillColor(200, 168, 75); doc.rect(0, 44, W, 2.5, 'F')

      // Watermark (before body text)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(88); doc.setTextColor(215, 222, 237)
      doc.text('CLEARED', W / 2, 178, { align: 'center', angle: 45 })

      // School name — large gold
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(200, 168, 75)
      doc.text(SCHOOL.name.toUpperCase(), W / 2, 17, { align: 'center' })
      // OFFICIAL DOCUMENT
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(200, 168, 75)
      doc.setCharSpace(2.5); doc.text('OFFICIAL DOCUMENT', W / 2, 27, { align: 'center' }); doc.setCharSpace(0)
      // Term
      doc.setFontSize(10); doc.setTextColor(170, 195, 225)
      doc.text(SCHOOL.term, W / 2, 37, { align: 'center' })

      // Certificate title
      doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(10, 31, 78)
      doc.text('FEE CLEARANCE CERTIFICATE', W / 2, 64, { align: 'center' })
      doc.setFillColor(200, 168, 75); doc.rect(38, 68, 134, 1, 'F')

      // Certify text
      doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(100, 116, 139)
      doc.text('This is to certify that:', W / 2, 82, { align: 'center' })

      // Student name
      doc.setFont('helvetica', 'bold'); doc.setFontSize(23); doc.setTextColor(10, 31, 78)
      doc.text(s.name.toUpperCase(), W / 2, 95, { align: 'center' })
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139)
      doc.text(`Admission No: ${s.admNo}   |   Class: ${s.cls}`, W / 2, 104, { align: 'center' })

      doc.setFontSize(11); doc.text('has fully settled all fee obligations for', W / 2, 117, { align: 'center' })
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(10, 31, 78)
      doc.text(SCHOOL.term, W / 2, 126, { align: 'center' })

      // Fee detail box
      doc.setFillColor(248, 249, 252); doc.setDrawColor(220, 228, 240); doc.setLineWidth(0.3)
      doc.rect(36, 134, 138, 46, 'FD')
      const feeRows: [string, string, number, number, number][] = [
        ['Total fees required:', 'KES ' + s.fee.toLocaleString(), 100, 116, 139],
        ['Total amount paid:', 'KES ' + s.paid.toLocaleString(), 10, 124, 78],
        ['Outstanding balance:', 'KES 0', 10, 124, 78],
      ]
      feeRows.forEach(([label, value, r, g, b], i) => {
        const y = 148 + i * 13
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139); doc.text(label, 44, y)
        doc.setFont('helvetica', 'bold'); doc.setTextColor(r, g, b); doc.text(value, W - 44, y, { align: 'right' })
      })

      // CLEARED stamp
      doc.setDrawColor(10, 124, 78); doc.setLineWidth(1); doc.rect(74, 188, 62, 21)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(10, 124, 78)
      doc.text('CLEARED', W / 2, 202, { align: 'center' })

      // Signature lines
      doc.setDrawColor(180, 192, 215); doc.setLineWidth(0.4)
      doc.line(24, 228, 90, 228); doc.line(120, 228, 186, 228)
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(10, 31, 78)
      doc.text('Bursar', 57, 234, { align: 'center' }); doc.text('Principal', 153, 234, { align: 'center' })
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(130, 140, 158)
      doc.text('Authorised Signatory', 57, 240, { align: 'center' })
      doc.text('Authorised Signatory', 153, 240, { align: 'center' })
      doc.text(SCHOOL.name, 57, 246, { align: 'center' }); doc.text(SCHOOL.name, 153, 246, { align: 'center' })

      // Date issued
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139)
      doc.text('Date issued: ' + today, W / 2, 258, { align: 'center' })

      // Validity
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(150, 162, 178)
      doc.text('This certificate is valid for ' + SCHOOL.term + ' only.', W / 2, 265, { align: 'center' })

      // Footer
      doc.setFillColor(10, 31, 78); doc.rect(0, 272, W, 25, 'F')
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 168, 75)
      doc.text('Generated by FeeTracker · support@feetracker.co.ke', W / 2, 282, { align: 'center' })

      doc.save(`FeeTracker_Certificate_${s.name.replace(/ /g, '_')}.pdf`)
    } catch (e) {
      console.error('PDF generation error:', e)
    }
    setGenerating(false)
  }

  return (
    <div>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
        Preview of the fee clearance certificate for{' '}
        <strong style={{ color: '#0f172a' }}>Brian Kamau</strong> — fully paid.
        Certificates can be generated instantly for any student with zero balance.
      </p>

      {/* Visual certificate preview */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '2px solid #e2e8f0', overflow: 'hidden', maxWidth: '480px', margin: '0 auto 20px', boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div style={{ background: '#0a1f4e', padding: '22px 28px', textAlign: 'center' as const }}>
          <p style={{ color: '#c8a84b', fontSize: '18px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: '0 0 3px' }}>{SCHOOL.name.toUpperCase()}</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>{SCHOOL.term}</p>
        </div>
        <div style={{ height: '3px', background: '#c8a84b' }} />

        {/* Body */}
        <div style={{ padding: '28px 32px', textAlign: 'center' as const }}>
          <p style={{ fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' as const, color: '#94a3b8', margin: '0 0 6px' }}>Fee Clearance Certificate</p>
          <div style={{ width: '60px', height: '2px', background: '#c8a84b', margin: '0 auto 18px' }} />

          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px' }}>This is to certify that</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#0a1f4e', fontFamily: 'Georgia, serif', margin: '4px 0' }}>{s.name.toUpperCase()}</p>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 4px' }}>{s.admNo} · {s.cls}</p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px' }}>
            has fully settled all fee obligations for <strong style={{ color: '#0a1f4e' }}>{SCHOOL.term}</strong>
          </p>

          <div style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '14px 16px', textAlign: 'left' as const, marginBottom: '20px' }}>
            {[
              { l: 'Fee required', v: 'KES ' + s.fee.toLocaleString(),  c: '#0f172a' },
              { l: 'Amount paid',  v: 'KES ' + s.paid.toLocaleString(), c: '#0a7c4e' },
              { l: 'Balance',      v: 'KES 0',                          c: '#0a7c4e' },
            ].map((row, i, arr) => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{row.l}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: row.c }}>{row.v}</span>
              </div>
            ))}
          </div>

          {/* Stamp */}
          <div style={{ display: 'inline-block', border: '2px solid #0a7c4e', borderRadius: '4px', padding: '6px 20px', marginBottom: '22px' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#0a7c4e', letterSpacing: '4px' }}>CLEARED</span>
          </div>

          {/* Signatures */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {['Bursar', 'Principal'].map(role => (
              <div key={role} style={{ borderTop: '1px solid #cbd5e1', paddingTop: '6px', textAlign: 'left' as const }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{role}</p>
                <p style={{ fontSize: '10px', color: '#cbd5e1', margin: '2px 0 0' }}>{SCHOOL.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#0a1f4e', padding: '8px 16px', textAlign: 'center' as const }}>
          <p style={{ fontSize: '10px', color: '#c8a84b', margin: 0 }}>Generated by FeeTracker · {today}</p>
        </div>
      </div>

      {/* Download button */}
      <div style={{ textAlign: 'center' as const, marginBottom: '16px' }}>
        <button
          onClick={download}
          disabled={generating}
          style={{ background: generating ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '12px 36px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer' }}
        >
          {generating ? 'Generating PDF…' : 'Download certificate PDF'}
        </button>
      </div>

      <div style={{ background: '#f8f9fc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
          <strong style={{ color: '#0f172a' }}>In your live account:</strong> certificates are generated for any fully-paid student in one click. The bursar can download as PDF or share directly on WhatsApp.
        </p>
      </div>

      <CTA />
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'students' | 'upload' | 'reminders' | 'certificate'

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard',   label: 'Dashboard'    },
  { id: 'students',    label: 'Students'     },
  { id: 'upload',      label: 'Upload Statement' },
  { id: 'reminders',   label: 'Reminders'    },
  { id: 'certificate', label: 'Certificate'  },
]

export default function Demo() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 640px) {
          .demo-content { padding: 16px !important; }
          .demo-stats   { grid-template-columns: repeat(2,1fr) !important; }
          .demo-tabs    { padding: 0 16px !important; }
        }
      `}</style>

      {/* Gold banner */}
      <div style={{ background: '#c8a84b', padding: '10px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a1f4e', margin: 0 }}>
          Live demo — sample data only. No real school data is shown.
        </p>
        <Link href="/signup" style={{ background: '#0a1f4e', color: '#c8a84b', padding: '6px 16px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
          Sign up free →
        </Link>
      </div>

      {/* App header */}
      <div style={{ background: '#0a1f4e', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif' }}>
              Fee<span style={{ color: '#c8a84b' }}>Tracker</span>
            </span>
            <span style={{ background: 'rgba(200,168,75,0.2)', color: '#c8a84b', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>DEMO</span>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3c8', margin: 0 }}>{SCHOOL.name} · {SCHOOL.term} · Paybill {SCHOOL.paybill}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ background: '#c8a84b', color: '#0a1f4e', fontSize: '11px', padding: '4px 12px', borderRadius: '999px', fontWeight: 700 }}>58% collected</span>
          <Link href="/signup" style={{ background: '#c8a84b', color: '#0a1f4e', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
            Get started free
          </Link>
        </div>
      </div>

      {/* Tab bar */}
      <div className="demo-tabs" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', display: 'flex', overflowX: 'auto' as const }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '13px 18px', fontSize: '13px', whiteSpace: 'nowrap' as const,
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? '#0a1f4e' : '#64748b',
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? '3px solid #c8a84b' : '3px solid transparent',
              cursor: 'pointer', transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="demo-content" style={{ padding: '24px 32px', maxWidth: '960px', margin: '0 auto' }}>
        {tab === 'dashboard'   && <TabDashboard />}
        {tab === 'students'    && <TabStudents />}
        {tab === 'upload'      && <TabUpload />}
        {tab === 'reminders'   && <TabReminders />}
        {tab === 'certificate' && <TabCertificate />}
      </div>
    </div>
  )
}
