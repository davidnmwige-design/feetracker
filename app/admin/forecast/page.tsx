'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function AdminForecast() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/forecast').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div style={{ color: '#94a3b8', padding: '60px 0', textAlign: 'center' }}>Loading forecast…</div>
  if (!data) return null

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Revenue Forecast</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Projected recurring revenue and upcoming renewals</p>
      </div>

      {/* Forecast cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Current MRR', value: `KES ${data.mrr.toLocaleString()}`, color: '#0f172a' },
          { label: 'Next month forecast', value: `KES ${data.nextMonthForecast.toLocaleString()}`, color: '#2563eb' },
          { label: 'Best case (all trials convert)', value: `KES ${data.bestCase.toLocaleString()}`, color: '#16a34a' },
          { label: 'Worst case (10% churn)', value: `KES ${data.worstCase.toLocaleString()}`, color: '#dc2626' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{card.label}</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Next quarter */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Next quarter estimated revenue</p>
        <p style={{ fontSize: '32px', fontWeight: 700, color: '#0a1f4e', margin: 0 }}>KES {data.nextQuarterForecast.toLocaleString()}</p>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>Based on current MRR × 3 months with 5% growth</p>
      </div>

      {/* MRR history chart */}
      {data.mrrHistory?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>MRR history (collected)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.mrrHistory} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `KES ${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'Collected']} contentStyle={{ fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <Line type="monotone" dataKey="amount" stroke="#c8a84b" strokeWidth={2.5} dot={{ fill: '#c8a84b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Trials expiring this month */}
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Trials expiring this month</h2>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 14px' }}>Conversion opportunities — {data.trialsExpiringThisMonth.length} schools</p>
          {data.trialsExpiringThisMonth.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No trials expiring this month.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.trialsExpiringThisMonth.map((s: any) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fef9ec', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                  <div>
                    <Link href={`/admin/schools/${s.id}`} style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', textDecoration: 'none' }}>{s.name}</Link>
                    <div style={{ fontSize: '11px', color: '#92681a' }}>Expires {new Date(s.trialEndsAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <a href={`mailto:${s.adminEmail}`} style={{ fontSize: '11px', color: '#92681a', background: '#fef3c7', padding: '4px 10px', borderRadius: '5px', textDecoration: 'none', fontWeight: 600 }}>
                    Email
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schools renewing this month */}
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Schools renewing this month</h2>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 14px' }}>Joined this month in a previous year — {data.renewingThisMonth.length} schools</p>
          {data.renewingThisMonth.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No renewals due this month.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {data.renewingThisMonth.map((s: any) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                  <div>
                    <Link href={`/admin/schools/${s.id}`} style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a', textDecoration: 'none' }}>{s.name}</Link>
                    <div style={{ fontSize: '11px', color: '#16a34a' }}>{s.plan} plan</div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#16a34a' }}>KES {s.monthlyFee.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
