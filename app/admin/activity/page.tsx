'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminActivity() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(data => { setSchools(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sorted = [...schools].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Activity</h1>
            <p className="text-gray-500 text-sm mt-0.5">Recent school signups and events</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-medium text-gray-900">All signups (newest first)</h2>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{minWidth: '560px'}}>
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="p-3">School</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Students</th>
                <th className="p-3">Trial ends</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">Loading...</td></tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-gray-400">No activity yet.</td></tr>
              )}
              {sorted.map(school => (
                <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-3 font-medium">{school.name}</td>
                  <td className="p-3 text-gray-500">
                    <div>{school.user?.name}</div>
                    <div className="text-xs text-gray-400">{school.user?.email}</div>
                  </td>
                  <td className="p-3">{school._count?.students || 0}</td>
                  <td className="p-3 text-gray-500">
                    {school.trialEndsAt
                      ? new Date(school.trialEndsAt).toLocaleDateString('en-KE')
                      : '—'}
                  </td>
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
      </div>
    </div>
  )
}
