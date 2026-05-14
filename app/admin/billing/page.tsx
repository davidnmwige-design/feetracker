'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getBillingAmount, getAnnualTotal, getSetupFee, getPlanName, getDiscountedAnnual, BILLING_DISCOUNTS } from '@/lib/pricing'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function schoolBillingAmount(school: any): number {
  const count = school._count?.students || 0
  const cycle = (school.billingCycle as 'monthly' | 'term' | 'annual') || 'monthly'
  return getBillingAmount(count, cycle)
}

function schoolMRR(school: any): number {
  const count = school._count?.students || 0
  return Math.round(getAnnualTotal(count) / 12)
}

export default function AdminBilling() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [billingRecords, setBillingRecords] = useState<any[]>([])
  const [markingPaid, setMarkingPaid] = useState<Record<number, boolean>>({})
  const [upgradeRequests, setUpgradeRequests] = useState<any[]>([])
  const [upgradeLoading, setUpgradeLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})
  const [overdueOnly, setOverdueOnly] = useState(false)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  useEffect(() => {
    fetch('/api/admin/schools').then(r => r.json()).then(d => { setSchools(Array.isArray(d) ? d : []); setLoading(false) })
    fetch('/api/admin/billing').then(r => r.json()).then(d => setBillingRecords(Array.isArray(d) ? d : []))
    fetch('/api/admin/upgrade').then(r => r.json()).then(d => { setUpgradeRequests(Array.isArray(d) ? d : []); setUpgradeLoading(false) })
  }, [])

  function getBillingRecord(schoolId: number) {
    return billingRecords.find(r => r.schoolId === schoolId && r.month === currentMonth && r.year === currentYear)
  }

  function getSchoolAllPaidRecords(schoolId: number) {
    return billingRecords.filter(r => r.schoolId === schoolId && r.isPaid)
  }

  function isOverdue(school: any) {
    const record = getBillingRecord(school.id)
    if (record?.isPaid) return false
    // Overdue if they joined more than 30 days ago and haven't paid this month
    return new Date(school.createdAt) < thirtyDaysAgo
  }

  async function togglePaid(school: any) {
    const amount = schoolBillingAmount(school)
    const existing = getBillingRecord(school.id)
    const newIsPaid = !existing?.isPaid
    setMarkingPaid(prev => ({ ...prev, [school.id]: true }))
    const res = await fetch('/api/admin/billing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolId: school.id, month: currentMonth, year: currentYear, amount, isPaid: newIsPaid }),
    })
    const record = await res.json()
    setBillingRecords(prev => {
      const filtered = prev.filter(r => !(r.schoolId === school.id && r.month === currentMonth && r.year === currentYear))
      return [...filtered, record]
    })
    setMarkingPaid(prev => ({ ...prev, [school.id]: false }))
  }

  async function handleUpgradeAction(requestId: number, action: 'approve' | 'reject') {
    setActionLoading(prev => ({ ...prev, [requestId]: true }))
    await fetch('/api/admin/upgrade', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    })
    setUpgradeRequests(prev => prev.filter(r => r.id !== requestId))
    if (action === 'approve') {
      const req = upgradeRequests.find(r => r.id === requestId)
      if (req) setSchools(prev => prev.map(s => s.id === req.schoolId ? { ...s, currentPlan: req.requestedPlan } : s))
    }
    setActionLoading(prev => ({ ...prev, [requestId]: false }))
  }

  const totalMRR = schools.reduce((sum, s) => sum + schoolMRR(s), 0)
  const paidThisMonth = billingRecords.filter(r => r.month === currentMonth && r.year === currentYear && r.isPaid)
  const totalPaidMonthly = paidThisMonth.reduce((sum, r) => sum + r.amount, 0)
  const outstanding = totalMRR - totalPaidMonthly
  const overdueSchools = schools.filter(isOverdue)

  const displayedSchools = overdueOnly ? schools.filter(isOverdue) : schools

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Billing</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Track subscriptions and payments for {MONTH_NAMES[currentMonth - 1]} {currentYear}</p>
      </div>

      {/* Revenue summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Collected this month', value: `KES ${totalPaidMonthly.toLocaleString()}`, color: '#16a34a' },
          { label: 'Outstanding this month', value: `KES ${outstanding.toLocaleString()}`, color: outstanding > 0 ? '#d97706' : '#94a3b8' },
          { label: `Overdue (30+ days) — ${overdueSchools.length} schools`, value: `KES ${overdueSchools.reduce((s, sch) => s + schoolMRR(sch), 0).toLocaleString()}`, color: overdueSchools.length > 0 ? '#dc2626' : '#94a3b8' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{card.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: card.color, margin: 0 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Pending upgrade requests */}
      {!upgradeLoading && upgradeRequests.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #fcd34d', marginBottom: '20px' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>{upgradeRequests.length}</span>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Pending Plan Upgrade Requests</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', minWidth: '640px' }}>
              <thead>
                <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {['School', 'Current plan', 'Requested', 'Notes', 'Submitted', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upgradeRequests.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f8f9fc' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{req.school?.name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{req.school?.user?.email}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}><span style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>{req.currentPlan}</span></td>
                    <td style={{ padding: '10px 14px' }}><span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>{req.requestedPlan}</span></td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '12px', maxWidth: '200px' }}>{req.notes || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{new Date(req.createdAt).toLocaleDateString('en-KE')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleUpgradeAction(req.id, 'approve')} disabled={actionLoading[req.id]}
                          style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          Approve
                        </button>
                        <button onClick={() => handleUpgradeAction(req.id, 'reject')} disabled={actionLoading[req.id]}
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Billing table */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            School billing — {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>
          <button onClick={() => setOverdueOnly(v => !v)}
            style={{ background: overdueOnly ? '#dc2626' : '#f8f9fc', color: overdueOnly ? '#fff' : '#64748b', border: `1px solid ${overdueOnly ? '#dc2626' : '#e2e8f0'}`, padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            {overdueOnly ? 'Clear filter' : `Show overdue only (${overdueSchools.length})`}
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', minWidth: '760px' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {['School', 'Plan', 'Students', 'Billing amount', 'Invoice history', 'Joined', 'This month'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading…</td></tr>}
              {displayedSchools.map(school => {
                const studentCount = school._count?.students || 0
                const planName = getPlanName(studentCount)
                const cycle = (school.billingCycle as 'monthly' | 'term' | 'annual') || 'monthly'
                const billingAmt = getBillingAmount(studentCount, cycle)
                const annualTotal = getAnnualTotal(studentCount)
                const record = getBillingRecord(school.id)
                const isPaid = record?.isPaid || false
                const isMarking = markingPaid[school.id] || false
                const overdue = isOverdue(school)
                const allPaid = getSchoolAllPaidRecords(school.id)
                const totalLifetime = allPaid.reduce((s, r) => s + r.amount, 0)
                const planColors: Record<string, string> = { Starter: '#f1f5f9', Growth: '#dbeafe', Professional: '#ede9fe', Premium: '#fef3c7', Enterprise: '#f3e8ff' }
                const planTextColors: Record<string, string> = { Starter: '#475569', Growth: '#1e40af', Professional: '#6d28d9', Premium: '#92400e', Enterprise: '#6b21a8' }
                const cycleLabel: Record<string, string> = { monthly: '/mo', term: '/term', annual: '/yr' }

                return (
                  <tr key={school.id} style={{ borderBottom: '1px solid #f8f9fc', borderLeft: overdue ? '3px solid #dc2626' : '3px solid transparent' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={`/admin/schools/${school.id}`} style={{ fontWeight: 600, color: '#0a1f4e', textDecoration: 'none' }}>{school.name}</Link>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>{school.user?.email}</div>
                      {overdue && <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>OVERDUE</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: planColors[planName] || '#f1f5f9', color: planTextColors[planName] || '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>{planName}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>{studentCount}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                      <div>KES {billingAmt.toLocaleString()}<span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>{cycleLabel[cycle]}</span></div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{studentCount} x 200 = KES {annualTotal.toLocaleString()}/yr</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#475569' }}>
                      <div>{allPaid.length} invoice{allPaid.length !== 1 ? 's' : ''}</div>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>KES {totalLifetime.toLocaleString()} total</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '12px' }}>{new Date(school.createdAt).toLocaleDateString('en-KE')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => togglePaid(school)} disabled={isMarking}
                        style={{ background: isPaid ? '#dcfce7' : '#fee2e2', color: isPaid ? '#166534' : '#dc2626', border: `1px solid ${isPaid ? '#bbf7d0' : '#fecaca'}`, padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        {isMarking ? '…' : isPaid ? 'Paid' : 'Mark paid'}
                      </button>
                      {isPaid && record?.paidAt && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{new Date(record.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
