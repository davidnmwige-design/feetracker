'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const TERMS = [
  'Term 1 2026', 'Term 2 2026', 'Term 3 2026',
  'Term 1 2027', 'Term 2 2027', 'Term 3 2027',
]

export default function Settings() {
  const [terms, setTerms] = useState<any[]>([])
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [schoolRes, termsRes] = await Promise.all([
      fetch('/api/school'),
      fetch('/api/terms')
    ])
    const schoolData = await schoolRes.json()
    const termsData = await termsRes.json()
    setSchool(schoolData)
    setTerms(termsData)
    setLoading(false)
  }

  async function startNewTerm() {
    if (!selectedTerm) return
    setStarting(true)
    await fetch('/api/terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termName: selectedTerm })
    })
    await fetchData()
    setSelectedTerm('')
    setStarting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
              <h2 className="font-medium text-gray-900 mb-1">School details</h2>
              <p className="text-sm text-gray-400 mb-4">Your school information</p>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">School name</span>
                  <span className="text-sm font-medium text-gray-900">{school?.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">MPESA Paybill</span>
                  <span className="text-sm font-medium text-gray-900">{school?.paybill || '—'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500">Current term</span>
                  <span className="text-sm font-medium text-gray-900">{school?.currentTerm}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
              <h2 className="font-medium text-gray-900 mb-1">Start a new term</h2>
              <p className="text-sm text-gray-400 mb-4">
                This will archive the current term and start fresh. All students stay in the system but payments reset for the new term.
              </p>
              <div className="flex gap-3">
                <select
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  value={selectedTerm}
                  onChange={e => setSelectedTerm(e.target.value)}
                >
                  <option value="">Select new term...</option>
                  {TERMS.filter(t => t !== school?.currentTerm).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  onClick={startNewTerm}
                  disabled={!selectedTerm || starting}
                  className="text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{backgroundColor: '#0a1f4e'}}
                >
                  {starting ? 'Starting...' : 'Start new term'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-medium text-gray-900 mb-4">Term history</h2>
              {terms.length === 0 ? (
                <p className="text-sm text-gray-400">No terms created yet.</p>
              ) : (
                <div className="space-y-2">
                  {terms.map(term => (
                    <div key={term.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                      <span className="text-sm font-medium text-gray-900">{term.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(term.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}