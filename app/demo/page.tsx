'use client'
import { useState } from 'react'
import Link from 'next/link'

const SCHOOL = { name: 'Westlands Academy', term: 'Term 2 2026' }

const STUDENTS = [
  { name: 'Brian Kamau',    class: 'Form 2 North', parent: 'Mary Kamau',    fee: 45000, paid: 45000 },
  { name: 'Aisha Mwangi',   class: 'Form 2 North', parent: 'James Mwangi',  fee: 45000, paid: 25000 },
  { name: 'Daniel Otieno',  class: 'Form 2 South', parent: 'Grace Otieno',  fee: 45000, paid: 0     },
  { name: 'Grace Njeri',    class: 'Form 3 North', parent: 'John Njeri',    fee: 52000, paid: 52000 },
  { name: 'Kevin Ochieng',  class: 'Form 3 South', parent: 'Peter Ochieng', fee: 52000, paid: 10000 },
  { name: 'Fatuma Hassan',  class: 'Form 4 East',  parent: 'Hassan Ali',    fee: 58000, paid: 58000 },
  { name: 'Samuel Waweru',  class: 'Form 4 West',  parent: 'Mary Waweru',   fee: 58000, paid: 30000 },
  { name: 'Lydia Chebet',   class: 'Form 1 North', parent: 'David Chebet',  fee: 42000, paid: 0     },
]

const RECENT_PAYMENTS = [
  { time: '10:42 AM', from: 'Fatuma Hassan', amount: 58000, student: 'Fatuma Hassan · Form 4 East' },
  { time: '09:15 AM', from: 'Grace Njeri',   amount: 52000, student: 'Grace Njeri · Form 3 North' },
  { time: '08:30 AM', from: 'Brian Kamau',   amount: 45000, student: 'Brian Kamau · Form 2 North' },
  { time: 'Yesterday', from: 'Samuel Waweru', amount: 30000, student: 'Samuel Waweru · Form 4 West' },
  { time: 'Yesterday', from: 'Aisha Mwangi', amount: 25000, student: 'Aisha Mwangi · Form 2 North' },
]

const REMINDERS = STUDENTS
  .filter(s => s.paid < s.fee)
  .sort((a, b) => (b.fee - b.paid) - (a.fee - a.paid))
  .slice(0, 3)
  .map(s => ({
    ...s,
    balance: s.fee - s.paid,
    msg: `Dear ${s.parent}, this is a friendly reminder from ${SCHOOL.name}. ${s.name} in ${s.class} has an outstanding fee balance of KES ${(s.fee - s.paid).toLocaleString()} for ${SCHOOL.term}. Kindly settle at your earliest convenience. Thank you. — ${SCHOOL.name}`,
  }))

const totalExpected  = STUDENTS.reduce((s, st) => s + st.fee, 0)
const totalCollected = STUDENTS.reduce((s, st) => s + st.paid, 0)
const outstanding    = totalExpected - totalCollected
const zeroPayment    = STUDENTS.filter(s => s.paid === 0).length
const collectionRate = Math.round((totalCollected / totalExpected) * 100)

type Tab = 'dashboard' | 'students' | 'reminders'

function StatusBadge({ paid, fee }: { paid: number; fee: number }) {
  const balance = fee - paid
  if (balance <= 0)  return <span style={{background:'#e1f5ee',color:'#0a7c4e',fontSize:'10px',padding:'3px 8px',borderRadius:'999px',fontWeight:700}}>Paid</span>
  if (paid > 0)       return <span style={{background:'#fef9ec',color:'#92600a',fontSize:'10px',padding:'3px 8px',borderRadius:'999px',fontWeight:700}}>Partial</span>
  return               <span style={{background:'#fcebeb',color:'#a32d2d',fontSize:'10px',padding:'3px 8px',borderRadius:'999px',fontWeight:700}}>Unpaid</span>
}

function SignupCTA() {
  return (
    <div style={{marginTop:'32px',background:'#0a1f4e',borderRadius:'10px',padding:'28px 32px',textAlign:'center'}}>
      <p style={{color:'#94a3c8',fontSize:'13px',marginBottom:'16px'}}>
        Ready to manage <strong style={{color:'#fff'}}>{SCHOOL.name.replace('Westlands Academy','your school')}</strong> like this?
      </p>
      <Link href="/signup" style={{display:'inline-block',background:'#c8a84b',color:'#0a1f4e',padding:'12px 32px',borderRadius:'6px',fontSize:'14px',fontWeight:700,textDecoration:'none'}}>
        Set up your school free →
      </Link>
    </div>
  )
}

export default function Demo() {
  const [tab, setTab] = useState<Tab>('dashboard')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'students',  label: 'Students'  },
    { id: 'reminders', label: 'Reminders' },
  ]

  return (
    <div style={{background:'#f8f9fc',minHeight:'100vh',fontFamily:'Arial, sans-serif'}}>
      <style>{`
        @media (max-width: 640px) {
          .demo-content { padding: 16px !important; }
          .demo-stats { grid-template-columns: repeat(2,1fr) !important; }
          .demo-stu-table { font-size: 11px !important; }
          .demo-stu-table th, .demo-stu-table td { padding: 8px 10px !important; }
          .demo-hide-mobile { display: none !important; }
        }
      `}</style>

      {/* Demo banner */}
      <div style={{background:'#c8a84b',padding:'10px 32px',textAlign:'center'}}>
        <p style={{fontSize:'13px',fontWeight:600,color:'#0a1f4e',margin:0}}>
          This is a live demo of FeeTracker. Data shown is sample data.{' '}
          <Link href="/signup" style={{color:'#0a1f4e',textDecoration:'underline',fontWeight:700}}>Sign up free</Link>
          {' '}to use it with your school's real data.
        </p>
      </div>

      {/* App header */}
      <div style={{background:'#0a1f4e',padding:'18px 32px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'3px'}}>
            <span style={{fontSize:'18px',fontWeight:700,color:'#fff',fontFamily:'Georgia, serif'}}>
              Fee<span style={{color:'#c8a84b'}}>Tracker</span>
            </span>
            <span style={{background:'rgba(200,168,75,0.2)',color:'#c8a84b',fontSize:'10px',padding:'2px 8px',borderRadius:'4px',fontWeight:600,letterSpacing:'0.5px'}}>DEMO</span>
          </div>
          <p style={{fontSize:'12px',color:'#94a3c8',margin:0}}>{SCHOOL.name} · {SCHOOL.term}</p>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <span style={{background:'#c8a84b',color:'#0a1f4e',fontSize:'11px',padding:'4px 12px',borderRadius:'999px',fontWeight:700}}>{collectionRate}% collected</span>
          <Link href="/signup" style={{background:'#c8a84b',color:'#0a1f4e',padding:'8px 18px',borderRadius:'5px',fontSize:'12px',fontWeight:700,textDecoration:'none'}}>
            Get started free
          </Link>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 32px',display:'flex',gap:'0'}}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding:'14px 20px',
              fontSize:'13px',
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? '#0a1f4e' : '#64748b',
              background:'none',
              border:'none',
              borderBottom: tab === t.id ? '3px solid #c8a84b' : '3px solid transparent',
              cursor:'pointer',
              transition:'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="demo-content" style={{padding:'24px 32px',maxWidth:'960px'}}>

        {/* ── DASHBOARD TAB ── */}
        {tab === 'dashboard' && (
          <div>
            <div className="demo-stats" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'20px'}}>
              {[
                { label:'Expected',    value:'KES ' + totalExpected.toLocaleString(),  color:'#0f172a' },
                { label:'Collected',   value:'KES ' + totalCollected.toLocaleString(), color:'#0a1f4e' },
                { label:'Outstanding', value:'KES ' + outstanding.toLocaleString(),    color:'#c8a84b' },
                { label:'Zero payment',value:String(zeroPayment),                     color:'#e24b4a' },
              ].map(card => (
                <div key={card.label} style={{background:'#fff',borderRadius:'8px',border:'1px solid #e2e8f0',padding:'16px'}}>
                  <p style={{fontSize:'10px',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'6px'}}>{card.label}</p>
                  <p style={{fontSize:'22px',fontWeight:700,color:card.color}}>{card.value}</p>
                </div>
              ))}
            </div>

            <div style={{background:'#fff',borderRadius:'8px',border:'1px solid #e2e8f0'}}>
              <div style={{padding:'14px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{fontSize:'13px',fontWeight:700,color:'#0f172a',margin:0}}>Recent payments</h2>
                <span style={{fontSize:'11px',color:'#94a3b8'}}>Sample data</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                  <thead>
                    <tr style={{textAlign:'left',borderBottom:'1px solid #f1f5f9'}}>
                      {['Time','From','Amount','Matched to','Status'].map(h => (
                        <th key={h} style={{padding:'10px 14px',color:'#94a3b8',fontWeight:500,fontSize:'10px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_PAYMENTS.map((p, i) => (
                      <tr key={i} style={{borderBottom:'1px solid #f8fafc'}}>
                        <td style={{padding:'10px 14px',color:'#64748b'}}>{p.time}</td>
                        <td style={{padding:'10px 14px',fontWeight:500}}>{p.from}</td>
                        <td style={{padding:'10px 14px',fontWeight:700}}>KES {p.amount.toLocaleString()}</td>
                        <td style={{padding:'10px 14px',color:'#64748b'}}>{p.student}</td>
                        <td style={{padding:'10px 14px'}}>
                          <span style={{background:'#e1f5ee',color:'#0a1f4e',fontSize:'10px',padding:'3px 8px',borderRadius:'999px',fontWeight:600}}>Matched</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <SignupCTA />
          </div>
        )}

        {/* ── STUDENTS TAB ── */}
        {tab === 'students' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
              <p style={{fontSize:'13px',color:'#64748b',margin:0}}>{STUDENTS.length} students · {SCHOOL.term}</p>
              <div style={{display:'flex',gap:'8px'}}>
                {[
                  { label:'Paid',    count: STUDENTS.filter(s => s.paid >= s.fee).length,              bg:'#e1f5ee', color:'#0a7c4e' },
                  { label:'Partial', count: STUDENTS.filter(s => s.paid > 0 && s.paid < s.fee).length, bg:'#fef9ec', color:'#92600a' },
                  { label:'Unpaid',  count: STUDENTS.filter(s => s.paid === 0).length,                 bg:'#fcebeb', color:'#a32d2d' },
                ].map(b => (
                  <span key={b.label} style={{background:b.bg,color:b.color,fontSize:'11px',padding:'4px 10px',borderRadius:'999px',fontWeight:600}}>
                    {b.count} {b.label}
                  </span>
                ))}
              </div>
            </div>

            <div style={{background:'#fff',borderRadius:'8px',border:'1px solid #e2e8f0',overflowX:'auto'}}>
              <table className="demo-stu-table" style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                <thead>
                  <tr style={{textAlign:'left',borderBottom:'1px solid #e2e8f0',background:'#f8f9fc'}}>
                    {['Student','Class','Parent','Fee','Paid','Balance','Status'].map(h => (
                      <th key={h} style={{padding:'10px 14px',color:'#64748b',fontWeight:600,fontSize:'11px'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STUDENTS.map((s, i) => {
                    const balance = s.fee - s.paid
                    return (
                      <tr key={i} style={{borderBottom:'1px solid #f8fafc'}}>
                        <td style={{padding:'10px 14px',fontWeight:600,color:'#0f172a'}}>{s.name}</td>
                        <td style={{padding:'10px 14px',color:'#64748b'}}>{s.class}</td>
                        <td className="demo-hide-mobile" style={{padding:'10px 14px',color:'#64748b'}}>{s.parent}</td>
                        <td style={{padding:'10px 14px'}}>KES {s.fee.toLocaleString()}</td>
                        <td style={{padding:'10px 14px',color:'#0a7c4e',fontWeight:600}}>KES {s.paid.toLocaleString()}</td>
                        <td style={{padding:'10px 14px',color: balance > 0 ? '#e24b4a' : '#0a7c4e',fontWeight:600}}>
                          {balance > 0 ? 'KES ' + balance.toLocaleString() : '—'}
                        </td>
                        <td style={{padding:'10px 14px'}}>
                          <StatusBadge paid={s.paid} fee={s.fee} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <SignupCTA />
          </div>
        )}

        {/* ── REMINDERS TAB ── */}
        {tab === 'reminders' && (
          <div>
            <p style={{fontSize:'13px',color:'#64748b',marginBottom:'16px'}}>
              {STUDENTS.filter(s => s.paid < s.fee).length} parents with outstanding balances. Click to open WhatsApp — messages are pre-filled automatically.
            </p>

            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              {REMINDERS.map((r, i) => (
                <div key={i} style={{background:'#fff',borderRadius:'8px',border:'1px solid #e2e8f0',overflow:'hidden'}}>
                  <div style={{padding:'14px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <span style={{fontSize:'13px',fontWeight:700,color:'#0f172a'}}>{r.name}</span>
                      <span style={{fontSize:'12px',color:'#94a3b8',marginLeft:'8px'}}>{r.class}</span>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'13px',fontWeight:700,color:'#e24b4a'}}>KES {r.balance.toLocaleString()} outstanding</div>
                      <div style={{fontSize:'11px',color:'#94a3b8'}}>Parent: {r.parent}</div>
                    </div>
                  </div>
                  <div style={{padding:'14px 16px'}}>
                    <p style={{fontSize:'11px',color:'#94a3b8',marginBottom:'8px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>Message preview</p>
                    <div style={{background:'#f8f9fc',border:'1px solid #e2e8f0',borderLeft:'3px solid #c8a84b',borderRadius:'0 6px 6px 0',padding:'10px 12px',fontSize:'13px',color:'#475569',lineHeight:'1.6',marginBottom:'12px'}}>
                      {r.msg}
                    </div>
                    <a
                      href={'https://wa.me/?text=' + encodeURIComponent(r.msg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'#25D366',color:'#fff',padding:'8px 16px',borderRadius:'5px',fontSize:'12px',fontWeight:700,textDecoration:'none'}}
                    >
                      <span>Send via WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginTop:'16px',background:'#f8f9fc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'14px 16px'}}>
              <p style={{fontSize:'12px',color:'#64748b',margin:0}}>
                <strong style={{color:'#0f172a'}}>In your live account:</strong> reminders are sent directly to the parent's WhatsApp number stored against each student. No copy-paste needed — just click Send.
              </p>
            </div>

            <SignupCTA />
          </div>
        )}
      </div>
    </div>
  )
}
