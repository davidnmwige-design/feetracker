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
const SORTS = ['Newest', 'Most students', 'Needs attention']

function OnboardingBar({ steps, completed }: { steps: Record<string, boolean>; completed: number }) {
  const labels: Record<string, string> = {
    accountCreated: 'Account', studentsUploaded: 'Students',
    paybillConfigured: 'Paybill', invoiceSent: 'Invoice', statementUploaded: 'Statement',
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>Setup progress</span>
        <span style={{ fontSize: '10px', color: completed === 5 ? '#0a7c4e' : '#64748b', fontWeight: 600 }}>{completed}/5</span>
      </div>
      <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '6px' }}>
        <div style={{ height: '100%', borderRadius: '4px', background: completed === 5 ? '#0a7c4e' : '#c8a84b', width: `${(completed / 5) * 100}%`, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {Object.entries(steps).map(([key, done]) => (
          <span key={key} style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '3px', background: done ? '#dcfce7' : '#fee2e2', color: done ? '#166534' : '#dc2626', fontWeight: 600 }}>
            {done ? '✓' : '✗'} {labels[key]}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function AdminSchools() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [billingRecords, setBillingRecords] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/schools').then(r => r.json()).then(d => { setSchools(Array.isArray(d) ? d : []); setLoading(false) })
    fetch('/api/admin/billing').then(r => r.json()).then(d => setBillingRecords(Array.isArray(d) ? d : []))
  }, [])

  const now = new Date()

  function getStatus(school: any) {
    const studentCount = school._count?.students || 0
    if (studentCount === 0) return 'No Students'
    if (school.trialEndsAt && new Date(school.trialEndsAt) > now) return 'On Trial'
    if (school.trialEndsAt && new Date(school.trialEndsAt) <= now) return 'Expired'
    return 'Active'
  }

  function getOnboardingSteps(school: any) {
    const steps = {
      accountCreated: true,
      studentsUploaded: (school._count?.students || 0) > 0,
      paybillConfigured: !!school.paybill,
      invoiceSent: (school.invoiceCount || 0) > 0,
      statementUploaded: (school.paymentCount || 0) > 0,
    }
    return { steps, completed: Object.values(steps).filter(Boolean).length }
  }

  function getLifetimeRevenue(schoolId: number) {
    return billingRecords.filter(r => r.schoolId === schoolId && r.isPaid).reduce((s, r) => s + (r.amount || 0), 0)
  }

  function getLastActiveColor(daysAgo: number | null) {
    if (daysAgo === null) return '#94a3b8'
    if (daysAgo <= 7) return '#16a34a'
    if (daysAgo <= 30) return '#d97706'
    return '#dc2626'
  }

  const q = search.toLowerCase()
  let filtered = schools.filter(s => {
    const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.user?.email || '').toLowerCase().includes(q)
    const status = getStatus(s)
    const matchFilter = filter === 'All' || filter === status
    return matchSearch && matchFilter
  })

  if (sort === 'Most students') filtered = [...filtered].sort((a, b) => (b._count?.students || 0) - (a._count?.students || 0))
  else if (sort === 'Needs attention') filtered = [...filtered].sort((a, b) => getOnboardingSteps(a).completed - getOnboardingSteps(b).completed)

  const STATUS_MAP: Record<string, { bg: string; color: string; label: string }> = {
    'On Trial':    { bg: '#fef9ec', color: '#92681a', label: 'Active Trial' },
    'Active':      { bg: '#e1f5ee', color: '#0a7c4e', label: 'Subscribed'   },
    'Expired':     { bg: '#fcebeb', color: '#a32d2d', label: 'Expired'      },
    'No Students': { bg: '#f1f5f9', color: '#64748b', label: 'No Students'  },
  }

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Schools</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>{schools.length} school{schools.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', background: '#fff', outline: 'none' }}>
            {SORTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', width: '220px', outline: 'none', background: '#fff' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: filter === f ? 700 : 500,
            background: filter === f ? '#0a1f4e' : '#fff',
            color: filter === f ? '#fff' : '#64748b',
            border: filter === f ? 'none' : '1px solid #e2e8f0', cursor: 'pointer',
          }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0' }}>Loading schools…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: '13px' }}>
          {search ? `No schools match "${search}"` : 'No schools yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map(school => {
            const plan = school.currentPlan || 'Starter'
            const planStyle = PLAN_STYLE[plan] || PLAN_STYLE.Starter
            const studentCount = school._count?.students || 0
            const totalFee = school.students?.reduce((s: number, st: any) => s + (st.feeRequired || 0), 0) || 0
            const totalPaid = school.students?.reduce((s: number, st: any) => s + (st.payments?.reduce((p: number, pay: any) => p + pay.amount, 0) || 0), 0) || 0
            const collectionRate = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : null
            const status = getStatus(school)
            const badge = STATUS_MAP[status]
            const { steps, completed } = getOnboardingSteps(school)
            const ltv = getLifetimeRevenue(school.id)
            const whatsappMsg = encodeURIComponent(`Hi ${school.user?.name}, this is Elimu Pay support.`)

            return (
              <div key={school.id} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0, flex: 1, paddingRight: '8px' }}>{school.name}</h3>
                  <span style={{ background: badge.bg, color: badge.color, fontSize: '10px', padding: '2px 7px', borderRadius: '999px', fontWeight: 600, whiteSpace: 'nowrap' }}>{badge.label}</span>
                </div>

                {/* Admin info + quick contact */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    <div style={{ fontWeight: 600, color: '#475569' }}>{school.user?.name}</div>
                    <div style={{ fontSize: '11px' }}>{school.user?.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a href={`mailto:${school.user?.email}`} title="Send email"
                      style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', textDecoration: 'none' }}>✉</a>
                    <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                      style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '5px 8px', fontSize: '13px', textDecoration: 'none' }}>💬</a>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: '#f8f9fc', borderRadius: '6px', padding: '8px 10px' }}>
                    <p style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 2px' }}>Students</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{studentCount}</p>
                  </div>
                  <div style={{ background: '#f8f9fc', borderRadius: '6px', padding: '8px 10px' }}>
                    <p style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 2px' }}>Collection</p>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: collectionRate !== null ? '#0a7c4e' : '#94a3b8', margin: 0 }}>
                      {collectionRate !== null ? collectionRate + '%' : '—'}
                    </p>
                  </div>
                </div>

                {/* Onboarding progress */}
                <OnboardingBar steps={steps} completed={completed} />

                {/* LTV + Plan + join date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                  <span style={{ background: planStyle.bg, color: planStyle.color, padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>{plan}</span>
                  <span style={{ color: '#64748b' }}>
                    LTV: <strong>KES {ltv > 0 ? ltv.toLocaleString() : '0'}</strong>
                  </span>
                  <span style={{ color: '#94a3b8' }}>{new Date(school.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>

                <Link href={'/admin/schools/' + school.id}
                  style={{ display: 'block', textAlign: 'center', padding: '7px', background: '#f8f9fc', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#0a1f4e', textDecoration: 'none', border: '1px solid #e2e8f0' }}>
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
