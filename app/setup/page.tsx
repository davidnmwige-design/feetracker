'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Setup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    paybill: '',
    term: 'Term 2 2026'
  })

  async function handleSubmit() {
    setLoading(true)
    const res = await fetch('/api/school', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Setup your school</h1>
        <p className="text-gray-500 text-sm mb-6">This takes 2 minutes. You only do it once.</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">School name</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="e.g. St. Mary's Academy"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">MPESA Paybill / Till number</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="e.g. 123456"
              value={form.paybill}
              onChange={e => setForm({ ...form, paybill: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Current term</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              value={form.term}
              onChange={e => setForm({ ...form, term: e.target.value })}
            >
              <option>Term 1 2026</option>
              <option>Term 2 2026</option>
              <option>Term 3 2026</option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name}
            className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50 mt-2"
          >
            {loading ? 'Saving...' : 'Save and continue'}
          </button>
        </div>
      </div>
    </div>
  )
}