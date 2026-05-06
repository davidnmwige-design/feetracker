'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminAnalytics() {
  const [schools, setSchools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/schools')
      .then(r => r.json())
      .then(data => { setSchools(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalSchools = schools.length
  const totalStudents = schools.reduce((sum, s) => sum + (s._count?.students || 0), 0)
  const trialSchools = schools.filter(s => s.trialEndsAt && new Date(s.trialEndsAt) > new Date()).length
  const activeSchools = schools.filter(s => (s._count?.students || 0) > 0).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-sm mt-0.5">Platform usage overview</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total schools', value: totalSchools },
            { label: 'Total students', value: totalStudents },
            { label: 'Active schools', value: activeSchools },
            { label: 'On free trial', value: trialSchools },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{loading ? '—' : stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-medium text-gray-900 mb-4">Schools by plan</h2>
          <div className="space-y-2">
            {['Starter', 'Growth', 'Premium'].map(plan => {
              const count = schools.filter(s => {
                const n = s._count?.students || 0
                if (plan === 'Starter') return n <= 300
                if (plan === 'Growth') return n > 300 && n <= 600
                return n > 600
              }).length
              const pct = totalSchools > 0 ? Math.round((count / totalSchools) * 100) : 0
              return (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{plan}</span>
                    <span className="text-gray-500">{count} schools ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: pct + '%', backgroundColor: '#0a1f4e' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
