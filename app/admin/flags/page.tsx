'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminFlags() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(data => { setSchools(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const flagged = schools.filter(s => (s._count?.students || 0) === 0)
  const trialExpired = schools.filter(s => s.trialEndsAt && new Date(s.trialEndsAt) < new Date())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Support flags</h1>
            <p className="text-gray-500 text-sm mt-0.5">Schools that may need attention</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">No students uploaded</p>
            <p className="text-2xl font-semibold text-red-600">{loading ? '—' : flagged.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Trial expired</p>
            <p className="text-2xl font-semibold text-amber-600">{loading ? '—' : trialExpired.length}</p>
          </div>
        </div>

        {flagged.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 mb-4">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-medium text-red-600">Schools with no students</h2>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{minWidth: '480px'}}>
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="p-3">School</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {flagged.map(school => (
                  <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 font-medium">{school.name}</td>
                    <td className="p-3 text-gray-500">{school.user?.email}</td>
                    <td className="p-3 text-gray-500">{new Date(school.createdAt).toLocaleDateString('en-KE')}</td>
                    <td className="p-3">
                      <Link href={'/admin/schools/' + school.id} className="text-xs text-blue-700 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        )}

        {trialExpired.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-medium text-amber-600">Trial expired — conversion opportunity</h2>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{minWidth: '480px'}}>
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="p-3">School</th>
                  <th className="p-3">Admin email</th>
                  <th className="p-3">Trial ended</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {trialExpired.map(school => (
                  <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 font-medium">{school.name}</td>
                    <td className="p-3 text-gray-500">{school.user?.email}</td>
                    <td className="p-3 text-gray-500">{new Date(school.trialEndsAt).toLocaleDateString('en-KE')}</td>
                    <td className="p-3">
                      <a href={'mailto:' + school.user?.email} className="text-xs text-blue-700 hover:underline">Email</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {!loading && flagged.length === 0 && trialExpired.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm">No flags right now. All schools look healthy.</p>
          </div>
        )}
      </div>
    </div>
  )
}
