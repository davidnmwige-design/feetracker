'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { getAnnualTotal, getPlanName } from '@/lib/pricing'

const PLAN_COLORS: Record<string, string> = { Starter: '#64748b', Growth: '#3b82f6', Professional: '#8b5cf6', Premium: '#f59e0b', Enterprise: '#c8a84b' }
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function schoolMRR(s: any): number {
  const count = s._count?.students || 0
  return Math.round(getAnnualTotal(count) / 12)
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
      <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, color: color || '#0f172a', margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}

export default function AdminAnalytics() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(data => { setSchools(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

  const totalSchools = schools.length
  const activeSchools = schools.filter(s => (s._count?.students || 0) > 0).length
  const totalStudents = schools.reduce((sum, s) => sum + (s._count?.students || 0), 0)
  const monthlyRevenue = schools.reduce((sum, s) => sum + schoolMRR(s), 0)
  const annualRunRate = monthlyRevenue * 12

  const newThisMonth = schools.filter(s => {
    const d = new Date(s.createdAt)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length
  const newLastMonth = schools.filter(s => {
    const d = new Date(s.createdAt)
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
  }).length
  const schoolGrowth = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : null

  const trialSchools = schools.filter(s => s.trialEndsAt && new Date(s.trialEndsAt) > now)
  const expiredTrials = schools.filter(s => s.trialEndsAt && new Date(s.trialEndsAt) <= now && (s._count?.students || 0) === 0)
  const noStudents = schools.filter(s => (s._count?.students || 0) === 0)
  const needsAttention = schools.filter(s => {
    const expired = s.trialEndsAt && new Date(s.trialEndsAt) <= now
    const noStu = (s._count?.students || 0) === 0
    return expired || noStu
  })

  const topSchools = [...schools]
    .sort((a, b) => (b._count?.students || 0) - (a._count?.students || 0))
    .slice(0, 10)

  // Build last-6-month MRR from school createdAt + plan
  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now)
    d.setDate(1)
    d.setMonth(now.getMonth() - (5 - i))
    const year = d.getFullYear()
    const month = d.getMonth()
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
    const revenue = schools
      .filter(s => new Date(s.createdAt) <= monthEnd)
      .reduce((sum, s) => sum + schoolMRR(s), 0)
    return { month: MONTH_NAMES[month], revenue }
  })

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Loading analytics…</div>

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Platform usage overview</p>
      </div>

      {/* Overview metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Total schools" value={totalSchools} />
        <StatCard label="Active schools" value={activeSchools} sub="with students" color="#0a1f4e" />
        <StatCard label="Total students" value={totalStudents.toLocaleString()} />
        <StatCard label="Monthly revenue" value={`KES ${monthlyRevenue.toLocaleString()}`} color="#0a7c4e" />
        <StatCard label="Annual run rate" value={`KES ${Math.round(annualRunRate / 1000)}K`} color="#0a7c4e" />
        <StatCard label="On free trial" value={trialSchools.length} />
      </div>

      {/* Revenue chart */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Monthly recurring revenue — last 6 months</h2>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 16px' }}>Estimated MRR based on active schools and their plans</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={revenueData} margin={{ top: 24, right: 16, left: 16, bottom: 4 }} barSize={36}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v === 0 ? '0' : `KES ${(v / 1000).toFixed(0)}K`}
              width={60}
            />
            <Tooltip
              formatter={(v) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']}
              contentStyle={{ fontSize: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
              cursor={{ fill: 'rgba(200,168,75,0.08)' }}
            />
            <Bar dataKey="revenue" fill="#0a1f4e" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="revenue"
                position="top"
                formatter={(v) => { const n = Number(v); return n === 0 ? '' : `KES ${(n / 1000).toFixed(0)}K` }}
                style={{ fill: '#c8a84b', fontSize: '10px', fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Plan distribution */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Plan distribution</h2>
          {['Starter', 'Growth', 'Professional', 'Premium', 'Enterprise'].map(plan => {
            const count = schools.filter(s => getPlanName(s._count?.students || 0) === plan).length
            const pct = totalSchools > 0 ? Math.round((count / totalSchools) * 100) : 0
            return (
              <div key={plan} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 600, color: PLAN_COLORS[plan] }}>{plan}</span>
                  <span style={{ color: '#64748b' }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: PLAN_COLORS[plan], borderRadius: '3px', transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Growth */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>Growth</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#f8f9fc', borderRadius: '6px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>New schools this month</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{newThisMonth}</p>
              </div>
              {schoolGrowth !== null && (
                <span style={{ fontSize: '12px', fontWeight: 700, color: schoolGrowth >= 0 ? '#0a7c4e' : '#e24b4a', background: schoolGrowth >= 0 ? '#e1f5ee' : '#fcebeb', padding: '4px 8px', borderRadius: '4px' }}>
                  {schoolGrowth >= 0 ? '+' : '-'}{Math.abs(schoolGrowth)}%
                </span>
              )}
            </div>
            <div style={{ background: '#f8f9fc', borderRadius: '6px', padding: '12px 16px' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>New last month</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#64748b', margin: 0 }}>{newLastMonth}</p>
            </div>
            <div style={{ background: '#f8f9fc', borderRadius: '6px', padding: '12px 16px' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Expired trials</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: expiredTrials.length > 0 ? '#e24b4a' : '#0f172a', margin: 0 }}>{expiredTrials.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top schools */}
      {topSchools.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Top schools by student count</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {['#', 'School', 'Plan', 'Students', 'Monthly fee', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', color: '#94a3b8', fontWeight: 500, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topSchools.map((school, i) => {
                  const studentCount = school._count?.students || 0
                  const plan = getPlanName(studentCount)
                  return (
                    <tr key={school.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '10px 16px', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <Link href={'/admin/schools/' + school.id} style={{ fontWeight: 600, color: '#0a1f4e', textDecoration: 'none' }}>{school.name}</Link>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ background: '#f8f9fc', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '11px' }}>{plan}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{studentCount}</td>
                      <td style={{ padding: '10px 16px', color: '#0a7c4e', fontWeight: 600 }}>KES {schoolMRR(school).toLocaleString()}/mo</td>
                      <td style={{ padding: '10px 16px', color: '#64748b' }}>{new Date(school.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schools needing attention */}
      {needsAttention.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Schools needing attention
              <span style={{ marginLeft: '8px', background: '#fcebeb', color: '#a32d2d', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>{needsAttention.length}</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {needsAttention.map((school, i) => {
              const issues: string[] = []
              if ((school._count?.students || 0) === 0) issues.push('No students')
              if (school.trialEndsAt && new Date(school.trialEndsAt) <= now) issues.push('Trial expired')
              return (
                <div key={school.id} style={{ padding: '12px 20px', borderBottom: i < needsAttention.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{school.name}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>{school.user?.email}</span>
                    <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {issues.map(issue => (
                        <span key={issue} style={{ background: '#fef9ec', color: '#92681a', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{issue}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={'mailto:' + school.user?.email}
                      style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}>
                      Email admin
                    </a>
                    <Link href={'/admin/schools/' + school.id}
                      style={{ fontSize: '11px', background: '#0a1f4e', color: '#fff', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}>
                      View profile
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
