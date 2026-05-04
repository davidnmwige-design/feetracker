'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => {
        if (r.status === 401) router.push('/login')
        return r.json()
      })
      .then(data => {
        setSchools(data)
        setLoading(false)
      })
  }, [])

  const totalSchools = schools.length
  const totalStudents = schools.reduce((sum, s) => sum + (s._count?.students || 0), 0)
  const totalPayments = schools.reduce((sum, s) => sum + (s._count?.payments || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">All schools on FeeTracker</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total schools</p>
            <p className="text-2xl font-semibold text-gray-900">{totalSchools}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total students</p>
            <p className="text-2xl font-semibold text-gray-900">{totalStudents}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total payments</p>
            <p className="text-2xl font-semibold text-gray-900">{totalPayments}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">All schools</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="p-3">School</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Current term</th>
                <th className="p-3">Students</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-400">Loading...</td></tr>
              )}
              {!loading && schools.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-400">No schools yet.</td></tr>
              )}
              {schools.map(school => (
                <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 font-medium">{school.name}</td>
                  <td className="p-3 text-gray-500">{school.user?.name} · {school.user?.email}</td>
                  <td className="p-3 text-gray-500">{school.currentTerm}</td>
                  <td className="p-3">{school._count?.students || 0}</td>
                  <td className="p-3 text-gray-500">{new Date(school.createdAt).toLocaleDateString('en-KE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}