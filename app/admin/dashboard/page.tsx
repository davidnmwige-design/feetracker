'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const PLAN_MONTHLY: Record<string, number> = { Starter: 4500, Growth: 6500, Premium: 9000, Enterprise: 15000 }

export default function AdminDashboard() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingUpgrades, setPendingUpgrades] = useState(0)

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(data => { setSchools(data); setLoading(false) })
    fetch('/api/admin/upgrade')
      .then(r => r.json())
      .then(data => { setPendingUpgrades(Array.isArray(data) ? data.length : 0) })
  }, [])

  const totalSchools = schools.length
  const totalStudents = schools.reduce((sum, s) => sum + (s._count?.students || 0), 0)
  const totalMonthly = schools.reduce((sum, s) => sum + (PLAN_MONTHLY[s.currentPlan || 'Starter'] || 4500), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-0.5">FeeTracker platform overview</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/billing"
              className={'border px-4 py-2 rounded-lg text-sm flex items-center gap-2 ' + (pendingUpgrades > 0 ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-gray-300 text-gray-700 hover:bg-gray-100')}
            >
              Billing
              {pendingUpgrades > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{pendingUpgrades}</span>
              )}
            </Link>
            <Link href="/admin/analytics" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">
              Analytics
            </Link>
            <Link href="/admin/flags" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-100">
              Support flags
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total schools</p>
            <p className="text-2xl font-semibold text-gray-900">{totalSchools}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total students</p>
            <p className="text-2xl font-semibold text-gray-900">{totalStudents}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Monthly revenue</p>
            <p className="text-2xl font-semibold text-green-700">KES {totalMonthly.toLocaleString()}</p>
          </div>
          <div className={'bg-white rounded-xl border p-4 ' + (pendingUpgrades > 0 ? 'border-amber-200' : 'border-gray-200')}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Upgrade requests</p>
            <p className={'text-2xl font-semibold ' + (pendingUpgrades > 0 ? 'text-amber-600' : 'text-gray-400')}>{pendingUpgrades}</p>
            {pendingUpgrades > 0 && (
              <Link href="/admin/billing" className="text-xs text-amber-600 hover:underline">Review →</Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">All schools</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{minWidth: '640px'}}>
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="p-3">School</th>
                <th className="p-3">Admin contact</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Students</th>
                <th className="p-3">Current term</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="p-4 text-center text-gray-400">Loading...</td></tr>
              )}
              {!loading && schools.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-gray-400">No schools yet.</td></tr>
              )}
              {schools.map(school => {
                const studentCount = school._count?.students || 0
                const plan = school.currentPlan || 'Starter'
                const planColor = plan === 'Starter' ? 'bg-gray-100 text-gray-700' : plan === 'Growth' ? 'bg-blue-100 text-blue-700' : plan === 'Premium' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                const status = studentCount === 0 ? 'No students' : 'Active'
                const statusColor = studentCount === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                return (
                  <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 font-medium">{school.name}</td>
                    <td className="p-3 text-gray-500">
                      <div>{school.user?.name}</div>
                      <div className="text-xs text-gray-400">{school.user?.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={'text-xs px-2 py-1 rounded-full font-medium ' + planColor}>{plan}</span>
                    </td>
                    <td className="p-3">{studentCount}</td>
                    <td className="p-3 text-gray-500">{school.currentTerm}</td>
                    <td className="p-3 text-gray-500">{new Date(school.createdAt).toLocaleDateString('en-KE')}</td>
                    <td className="p-3">
                      <span className={'text-xs px-2 py-1 rounded-full font-medium ' + statusColor}>{status}</span>
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
