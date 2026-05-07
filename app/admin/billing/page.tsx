'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PLANS = {
  Starter: { monthly: 4500, setup: 15000, maxStudents: 300 },
  Growth: { monthly: 6500, setup: 20000, maxStudents: 600 },
  Premium: { monthly: 9000, setup: 25000, maxStudents: 1000 },
  Enterprise: { monthly: 15000, setup: 35000, maxStudents: null },
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function AdminBilling() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [billingRecords, setBillingRecords] = useState<any[]>([])
  const [markingPaid, setMarkingPaid] = useState<Record<number, boolean>>({})
  const [upgradeRequests, setUpgradeRequests] = useState<any[]>([])
  const [upgradeLoading, setUpgradeLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(data => { setSchools(data); setLoading(false) })
    fetch('/api/admin/billing')
      .then(r => r.json())
      .then(data => setBillingRecords(Array.isArray(data) ? data : []))
    fetch('/api/admin/upgrade')
      .then(r => r.json())
      .then(data => { setUpgradeRequests(Array.isArray(data) ? data : []); setUpgradeLoading(false) })
  }, [])

  function getBillingRecord(schoolId: number) {
    return billingRecords.find(r => r.schoolId === schoolId && r.month === currentMonth && r.year === currentYear)
  }

  async function togglePaid(school: any) {
    const planName = getPlanName(school)
    const plan = PLANS[planName as keyof typeof PLANS] || PLANS.Starter
    const existing = getBillingRecord(school.id)
    const newIsPaid = !existing?.isPaid

    setMarkingPaid(prev => ({ ...prev, [school.id]: true }))
    const res = await fetch('/api/admin/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: school.id,
        month: currentMonth,
        year: currentYear,
        amount: plan.monthly,
        isPaid: newIsPaid,
      }),
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action })
    })
    setUpgradeRequests(prev => prev.filter(r => r.id !== requestId))
    if (action === 'approve') {
      const req = upgradeRequests.find(r => r.id === requestId)
      if (req) {
        setSchools(prev => prev.map(s => s.id === req.schoolId ? { ...s, currentPlan: req.requestedPlan } : s))
      }
    }
    setActionLoading(prev => ({ ...prev, [requestId]: false }))
  }

  const getPlanName = (school: any) => school.currentPlan || 'Starter'

  const totalMonthly = schools.reduce((sum, s) => {
    const plan = PLANS[getPlanName(s) as keyof typeof PLANS] || PLANS.Starter
    return sum + plan.monthly
  }, 0)

  const totalSetup = schools.reduce((sum, s) => {
    const plan = PLANS[getPlanName(s) as keyof typeof PLANS] || PLANS.Starter
    return sum + plan.setup
  }, 0)

  const paidThisMonth = billingRecords.filter(r => r.month === currentMonth && r.year === currentYear && r.isPaid)
  const totalPaidMonthly = paidThisMonth.reduce((sum, r) => sum + r.amount, 0)
  const totalOutstanding = totalMonthly - totalPaidMonthly

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track what each school owes you</p>
          </div>
        </div>

        {/* Pending upgrade requests */}
        {!upgradeLoading && upgradeRequests.length > 0 && (
          <div className="bg-white rounded-xl border border-amber-200 mb-6">
            <div className="p-4 border-b border-amber-100 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{upgradeRequests.length}</span>
              <h2 className="font-medium text-gray-900">Pending Plan Upgrade Requests</h2>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{minWidth: '640px'}}>
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="p-3">School</th>
                  <th className="p-3">Current plan</th>
                  <th className="p-3">Requested plan</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {upgradeRequests.map(req => (
                  <tr key={req.id} className="border-b border-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{req.school?.name}</div>
                      <div className="text-xs text-gray-400">{req.school?.user?.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">{req.currentPlan}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-700">{req.requestedPlan}</span>
                    </td>
                    <td className="p-3 text-gray-500 text-xs max-w-xs">{req.notes || '—'}</td>
                    <td className="p-3 text-gray-500 text-xs">{new Date(req.createdAt).toLocaleDateString('en-KE')}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpgradeAction(req.id, 'approve')}
                          disabled={actionLoading[req.id]}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpgradeAction(req.id, 'reject')}
                          disabled={actionLoading[req.id]}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                        >
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Monthly recurring</p>
            <p className="text-2xl font-semibold text-gray-900">KES {totalMonthly.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total setup fees</p>
            <p className="text-2xl font-semibold text-gray-900">KES {totalSetup.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Collected this month</p>
            <p className="text-2xl font-semibold text-green-700">KES {totalPaidMonthly.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Outstanding</p>
            <p className="text-2xl font-semibold text-red-600">KES {totalOutstanding.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">School billing — {MONTH_NAMES[currentMonth - 1]} {currentYear}</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{minWidth: '640px'}}>
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="p-3">School</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Students</th>
                <th className="p-3">Monthly fee</th>
                <th className="p-3">Setup fee</th>
                <th className="p-3">Joined</th>
                <th className="p-3">This month</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="p-4 text-center text-gray-400">Loading...</td></tr>
              )}
              {schools.map(school => {
                const studentCount = school._count?.students || 0
                const planName = getPlanName(school)
                const plan = PLANS[planName as keyof typeof PLANS] || PLANS.Starter
                const record = getBillingRecord(school.id)
                const isPaid = record?.isPaid || false
                const isMarking = markingPaid[school.id] || false
                const planColor = planName === 'Starter' ? 'bg-gray-100 text-gray-700' : planName === 'Growth' ? 'bg-blue-100 text-blue-700' : planName === 'Premium' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'

                return (
                  <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3">
                      <Link href={'/admin/schools/' + school.id} className="font-medium text-blue-900 hover:underline">{school.name}</Link>
                      <div className="text-xs text-gray-400">{school.user?.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={'text-xs px-2 py-1 rounded-full font-medium ' + planColor}>{planName}</span>
                    </td>
                    <td className="p-3">{studentCount}</td>
                    <td className="p-3 font-medium">KES {plan.monthly.toLocaleString()}</td>
                    <td className="p-3 text-gray-500">KES {plan.setup.toLocaleString()}</td>
                    <td className="p-3 text-gray-500">{new Date(school.createdAt).toLocaleDateString('en-KE')}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => togglePaid(school)}
                          disabled={isMarking}
                          className={'text-xs px-3 py-1.5 rounded-lg font-medium border disabled:opacity-50 ' + (isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200')}
                        >
                          {isMarking ? '...' : isPaid ? 'Paid ✓' : 'Mark as paid'}
                        </button>
                        {isPaid && record?.paidAt && (
                          <span className="text-xs text-gray-400">
                            {new Date(record.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}
