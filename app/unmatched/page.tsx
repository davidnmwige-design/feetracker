'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Unmatched() {
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<number | null>(null)
  const [selected, setSelected] = useState<Record<number, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [paymentsRes, studentsRes] = await Promise.all([
      fetch('/api/unmatched'),
      fetch('/api/students')
    ])
    const paymentsData = await paymentsRes.json()
    const studentsData = await studentsRes.json()
    setPayments(paymentsData)
    setStudents(studentsData)
    setLoading(false)
  }

  async function assignPayment(paymentId: number) {
    const studentId = selected[paymentId]
    if (!studentId) return
    setAssigning(paymentId)
    await fetch('/api/unmatched', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, studentId: Number(studentId) })
    })
    await fetchData()
    setAssigning(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Unmatched Payments</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manually assign payments that could not be matched automatically</p>
          </div>
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        )}

        {!loading && payments.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 font-medium">No unmatched payments</p>
            <p className="text-gray-400 text-sm mt-1">All payments have been matched to students.</p>
          </div>
        )}

        <div className="space-y-3">
          {payments.map(payment => (
            <div key={payment.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">KES {payment.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    From: {payment.senderName || 'Unknown'} · {payment.senderPhone || 'No phone'}
                  </p>
                  <p className="text-sm text-gray-400">
                    Ref: {payment.mpesaRef || '—'} · {new Date(payment.paidAt).toLocaleDateString('en-KE')}
                  </p>
                </div>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  Unmatched
                </span>
              </div>

              <div className="flex gap-2">
                <select
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  value={selected[payment.id] || ''}
                  onChange={e => setSelected({ ...selected, [payment.id]: e.target.value })}
                >
                  <option value="">Select student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.class} {s.stream} · {s.admNo}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => assignPayment(payment.id)}
                  disabled={!selected[payment.id] || assigning === payment.id}
                  className="text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-50"
                  style={{backgroundColor: '#0a1f4e'}}
                >
                  {assigning === payment.id ? 'Saving...' : 'Assign'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}