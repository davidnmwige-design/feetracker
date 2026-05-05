'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PLANS = {
  Starter: { monthly: 4500, setup: 15000, maxStudents: 300 },
  Growth: { monthly: 6500, setup: 20000, maxStudents: 600 },
  Premium: { monthly: 9000, setup: 25000, maxStudents: 1000 },
}

function getPlan(studentCount: number) {
  if (studentCount <= 300) return 'Starter'
  if (studentCount <= 600) return 'Growth'
  return 'Premium'
}

export default function AdminBilling() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(data => {
        setSchools(data)
        setLoading(false)
      })
  }, [])

  const totalMonthly = schools.reduce((sum, s) => {
    const plan = getPlan(s._count?.students || 0)
    return sum + PLANS[plan as keyof typeof PLANS].monthly
  }, 0)

  const totalSetup = schools.reduce((sum, s) => {
    const plan = getPlan(s._count?.students || 0)
    return sum + PLANS[plan as keyof typeof PLANS].setup
  }, 0)

  const totalPaidMonthly = schools.filter(s => paid[s.id]).reduce((sum, s) => {
    const plan = getPlan(s._count?.students || 0)
    return sum + PLANS[plan as keyof typeof PLANS].monthly
  }, 0)

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

        <div className="grid grid-cols-4 gap-4 mb-6">
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
            <h2 className="font-medium text-gray-900">School billing — {new Date().toLocaleString('en-KE', { month: 'long', year: 'numeric' })}</h2>
          </div>
          <table className="w-full text-sm">
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
                const planName = getPlan(studentCount)
                const plan = PLANS[planName as keyof typeof PLANS]
                const isPaid = paid[school.id] || false
                const planColor = planName === 'Starter' ? 'bg-gray-100 text-gray-700' : planName === 'Growth' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'

                return (
                  <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{school.name}</div>
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
                      <button
                        onClick={() => setPaid(prev => ({ ...prev, [school.id]: !prev[school.id] }))}
                        className={'text-xs px-3 py-1.5 rounded-lg font-medium border ' + (isPaid ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200')}
                      >
                        {isPaid ? 'Paid ✓' : 'Mark as paid'}
                      </button>
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