'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PLAN_STYLE: Record<string, { bg: string; color: string }> = {
  Starter:    { bg: '#f1f5f9', color: '#475569' },
  Growth:     { bg: '#dbeafe', color: '#1e40af' },
  Premium:    { bg: '#fef3c7', color: '#92400e' },
  Enterprise: { bg: '#f3e8ff', color: '#6b21a8' },
}

const FILTERS = ['All', 'Active', 'On Trial', 'Expired', 'No Students']

export default function AdminSchools() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(data => { setSchools(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const now = new Date()

  function getStatus(school: any) {
    const studentCount = school._count?.students || 0
    if (studentCount === 0) return 'No Students'
    if (school.trialEndsAt && new Date(school.trialEndsAt) > now) return 'On Trial'
    if (school.trialEndsAt && new Date(school.trialEndsAt) <= now) return 'Expired'
    return 'Active'
  }

  const q = search.toLowerCase()
  const filtered = schools.filter(s => {
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.user?.email || '').toLowerCase().includes(q)
    const status = getStatus(s)
    const matchFilter = filter === 'All' || filter === status
    return matchSearch && matchFilter
  })

  function TrialBadge({ school }: { school: any }) {
    const status = getStatus(school)
    const map: Record<string, { bg: string; color: string; label: string }> = {
      'On Trial':   { bg: '#fef9ec', color: '#92681a', label: 'Active Trial' },
      'Active':     { bg: '#e1f5ee', color: '#0a7c4e', label: 'Subscribed'   },
      'Expired':    { bg: '#fcebeb', color: '#a32d2d', label: 'Expired'       },
      'No Students':{ bg: '#f1f5f9', color: '#64748b', label: 'No Students'  },
    }
    const s = map[status]
    return <span style={{ background: s.bg, color: s.color, fontSize: '10px', padding: '3px 8px', borderRadius: '999px', fontWeight: 600 }}>{s.label}</span>
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Schools</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>{schools.length} school{schools.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', width: '260px', outline: 'none', background: '#fff' }}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: filter === f ? 700 : 500,
            background: filter === f ? '#0a1f4e' : '#fff',
            color: filter === f ? '#fff' : '#64748b',
            border: filter === f ? 'none' : '1px solid #e2e8f0',
            cursor: 'pointer',
          }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0' }}>Loading schools…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: '13px' }}>
          {search ? `No schools match "${search}"` : 'No schools yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map(school => {
            const plan = school.currentPlan || 'Starter'
            const planStyle = PLAN_STYLE[plan] || PLAN_STYLE.Starter
            const studentCount = school._count?.students || 0
            const totalFee = school.students?.reduce((s: number, st: any) => s + (st.feeRequired || 0), 0) || 0
            const totalPaid = school.students?.reduce((s: number, st: any) =>
              s + st.payments?.reduce((p: number, pay: any) => p + pay.amount, 0), 0) || 0
            const collectionRate = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : null

            return (
              <div key={school.id} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, flex: 1, paddingRight: '8px' }}>{school.name}</h3>
                  <TrialBadge school={school} />
                </div>

                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  <div style={{ fontWeight: 600, color: '#475569' }}>{school.user?.name}</div>
                  <div>{school.user?.email}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: '#f8f9fc', borderRadius: '6px', padding: '10px' }}>
                    <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 3px' }}>Students</p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{studentCount}</p>
                  </div>
                  <div style={{ background: '#f8f9fc', borderRadius: '6px', padding: '10px' }}>
                    <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 3px' }}>Collection</p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: collectionRate !== null ? '#0a7c4e' : '#94a3b8', margin: 0 }}>
                      {collectionRate !== null ? collectionRate + '%' : '—'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span style={{ background: planStyle.bg, color: planStyle.color, padding: '3px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '11px' }}>
                    {plan}
                  </span>
                  <span style={{ color: '#94a3b8' }}>
                    Joined {new Date(school.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                <Link href={'/admin/schools/' + school.id}
                  style={{ display: 'block', textAlign: 'center', padding: '8px', background: '#f8f9fc', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#0a1f4e', textDecoration: 'none', border: '1px solid #e2e8f0' }}>
                  View profile →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
