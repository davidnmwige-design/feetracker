'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSetup() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    secretKey: ''
  })

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin setup</h1>
          <p className="text-gray-500 text-sm">Create your Elimu Pay admin account</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
            Admin account created! Redirecting to login...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Your name</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              placeholder="Admin name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              placeholder="admin@feetracker.co.ke"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              placeholder="Strong password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Secret key</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              placeholder="Admin secret key"
              value={form.secretKey}
              onChange={e => setForm({ ...form, secretKey: e.target.value })}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.email || !form.password || !form.secretKey}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            style={{backgroundColor: '#0a1f4e'}}
          >
            {loading ? 'Creating...' : 'Create admin account'}
          </button>
        </div>
      </div>
    </div>
  )
}