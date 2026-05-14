'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getAnnualTotal } from '@/lib/pricing'

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function schoolMRR(s: any): number {
  return Math.round(getAnnualTotal(s._count?.students || 0) / 12)
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
      <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: color || '#0f172a', margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}

function TodayCard({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div>
        <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{value}</p>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>{label}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingUpgrades, setPendingUpgrades] = useState(0)
  const [todayStats, setTodayStats] = useState<any>(null)
  const [billingRecords, setBillingRecords] = useState<any[]>([])
  const [announcementModal, setAnnouncementModal] = useState(false)
  const [annSubject, setAnnSubject] = useState('')
  const [annMessage, setAnnMessage] = useState('')
  const [annSending, setAnnSending] = useState(false)
  const [annResult, setAnnResult] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/schools').then(r => r.json()).then(d => { setSchools(Array.isArray(d) ? d : []); setLoading(false) })
    fetch('/api/admin/upgrade').then(r => r.json()).then(d => { setPendingUpgrades(Array.isArray(d) ? d.length : 0) })
    fetch('/api/admin/stats/today').then(r => r.json()).then(setTodayStats)
    fetch('/api/admin/billing').then(r => r.json()).then(d => setBillingRecords(Array.isArray(d) ? d : []))
  }, [])

  const totalSchools = schools.length
  const totalStudents = schools.reduce((sum, s) => sum + (s._count?.students || 0), 0)
  const mrr = schools.reduce((sum, s) => sum + schoolMRR(s), 0)

  // 6-month MRR trend from billing records
  const now = new Date()
  const mrrTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    const paid = billingRecords.filter(r => r.month === month && r.year === year && r.isPaid)
    const amount = paid.reduce((s, r) => s + r.amount, 0)
    // Fall back to estimated MRR for recent months with no billing data
    return { month: MONTH_ABBR[d.getMonth()], amount: amount || (i === 5 ? mrr : 0) }
  })

  async function sendAnnouncement() {
    if (!annSubject.trim() || !annMessage.trim() || annSending) return
    setAnnSending(true)
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: annSubject, message: annMessage, recipientType: 'all' }),
      })
      const data = await res.json()
      setAnnResult(`Sent to ${data.sentCount} school${data.sentCount !== 1 ? 's' : ''}`)
      setAnnSubject(''); setAnnMessage('')
      setTimeout(() => { setAnnouncementModal(false); setAnnResult(null) }, 2000)
    } catch { setAnnResult('Failed to send') }
    setAnnSending(false)
  }

  async function handleExport() {
    setExportLoading(true)
    const res = await fetch('/api/admin/export-all')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'elimupay-schools.xlsx'; a.click()
    URL.revokeObjectURL(url)
    setExportLoading(false)
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Dashboard</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Elimu Pay platform overview</p>
      </div>

      {/* Main KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <StatCard label="Total schools" value={totalSchools} />
        <StatCard label="Total students" value={totalStudents.toLocaleString()} />
        <StatCard label="Monthly revenue" value={`KES ${mrr.toLocaleString()}`} color="#0a7c4e" />
        <StatCard label="Pending upgrades" value={pendingUpgrades} color={pendingUpgrades > 0 ? '#d97706' : '#94a3b8'}
          sub={pendingUpgrades > 0 ? 'Needs review' : undefined} />
      </div>

      {/* Churn + Trial Conversion */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Schools inactive this month</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: (todayStats?.churnCount || 0) > 0 ? '#dc2626' : '#94a3b8', margin: 0 }}>
            {todayStats?.churnCount ?? '—'}
          </p>
          <Link href="/admin/flags" style={{ fontSize: '11px', color: '#64748b', textDecoration: 'none' }}>View at-risk schools →</Link>
        </div>
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Trial conversion rate</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#0a1f4e', margin: 0 }}>
            {todayStats ? `${todayStats.trialConversionRate}%` : '—'}
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>
            {todayStats ? `${todayStats.trialConverted} of ${todayStats.totalTrials} trials converted` : ''}
          </p>
        </div>
      </div>

      {/* Today's activity */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Today's activity</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <TodayCard icon="🏫" value={todayStats?.newSchools ?? 0} label="New signups" />
          <TodayCard icon="💳" value={todayStats?.paymentsToday ?? 0} label="Payments processed" />
          <TodayCard icon="📤" value={todayStats?.uploadsToday ?? 0} label="Statements uploaded" />
          <TodayCard icon="📄" value={todayStats?.invoicesToday ?? 0} label="Invoices sent" />
        </div>
      </div>

      {/* MRR Trend Chart */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>MRR Trend — last 6 months</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={mrrTrend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `KES ${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={70} />
            <Tooltip formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'MRR']} contentStyle={{ fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
            <Line type="monotone" dataKey="amount" stroke="#c8a84b" strokeWidth={2.5} dot={{ fill: '#c8a84b', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px 20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' }}>Quick actions</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setAnnouncementModal(true)}
            style={{ background: '#0a1f4e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            ✉ Send announcement
          </button>
          <Link href="/admin/billing"
            style={{ background: pendingUpgrades > 0 ? '#fef3c7' : '#f8f9fc', color: pendingUpgrades > 0 ? '#92400e' : '#475569', border: `1px solid ${pendingUpgrades > 0 ? '#fcd34d' : '#e2e8f0'}`, padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            {pendingUpgrades > 0 ? `⚠ ${pendingUpgrades} pending upgrades` : '◈ View upgrades'}
          </Link>
          <Link href="/admin/onboarding"
            style={{ background: '#f8f9fc', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            ✓ Onboarding tracker
          </Link>
          <button onClick={handleExport} disabled={exportLoading}
            style={{ background: '#f8f9fc', color: '#475569', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            {exportLoading ? 'Exporting…' : '↓ Export all data'}
          </button>
        </div>
      </div>

      {/* Schools table */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>All schools</h2>
          <Link href="/admin/schools" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>View all →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {['School', 'Admin', 'Plan', 'Students', 'Term', 'Joined', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading…</td></tr>}
              {!loading && schools.length === 0 && <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No schools yet.</td></tr>}
              {schools.map(school => {
                const studentCount = school._count?.students || 0
                const plan = school.currentPlan || 'Starter'
                const planColors: Record<string, string> = { Starter: '#f1f5f9', Growth: '#dbeafe', Premium: '#fef3c7', Enterprise: '#f3e8ff' }
                const planTextColors: Record<string, string> = { Starter: '#475569', Growth: '#1e40af', Premium: '#92400e', Enterprise: '#6b21a8' }
                return (
                  <tr key={school.id} style={{ borderBottom: '1px solid #f8f9fc' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                      <Link href={`/admin/schools/${school.id}`} style={{ color: '#0a1f4e', textDecoration: 'none' }}>{school.name}</Link>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>
                      <div style={{ fontSize: '12px' }}>{school.user?.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{school.user?.email}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: planColors[plan] || '#f1f5f9', color: planTextColors[plan] || '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>{plan}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{studentCount}</td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px' }}>{school.currentTerm}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{new Date(school.createdAt).toLocaleDateString('en-KE')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        background: studentCount === 0 ? '#fee2e2' : '#dcfce7',
                        color: studentCount === 0 ? '#dc2626' : '#16a34a',
                        fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600
                      }}>{studentCount === 0 ? 'No students' : 'Active'}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Announcement Modal */}
      {announcementModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '500px', width: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Send announcement to all schools</h3>
            {annResult ? (
              <div style={{ textAlign: 'center', padding: '16px', fontSize: '14px', color: '#0a7c4e', fontWeight: 700 }}>{annResult}</div>
            ) : (
              <>
                <input value={annSubject} onChange={e => setAnnSubject(e.target.value)} placeholder="Subject line"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', marginBottom: '10px', outline: 'none', boxSizing: 'border-box' }} />
                <textarea value={annMessage} onChange={e => setAnnMessage(e.target.value)} placeholder="Message…" rows={5}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', marginBottom: '16px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setAnnouncementModal(false)} style={{ background: '#f8f9fc', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={sendAnnouncement} disabled={annSending || !annSubject.trim() || !annMessage.trim()}
                    style={{ background: annSending ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: annSending ? 'not-allowed' : 'pointer' }}>
                    {annSending ? 'Sending…' : `Send to ${totalSchools} schools`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
