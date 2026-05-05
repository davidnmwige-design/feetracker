'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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

export default function SchoolDetail() {
  const { id } = useParams()
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/admin/schools/' + id)
      .then(r => r.json())
      .then(data => {
        setSchool(data)
        setLoading(false)
      })
  }, [id])

  function addNote() {
    if (!note.trim()) return
    const timestamp = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
    setNotes(prev => [...prev, timestamp + ' — ' + note])
    setNote('')
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
  if (!school) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">School not found</div>

  const studentCount = school._count?.students || 0
  const planName = getPlan(studentCount)
  const plan = PLANS[planName as keyof typeof PLANS]
  const totalExpected = school.students?.reduce((sum: number, s: any) => sum + s.feeRequired, 0) || 0
  const totalCollected = school.students?.reduce((sum: number, s: any) =>
    sum + s.payments.reduce((p: number, pay: any) => p + pay.amount, 0), 0) || 0
  const waLink = 'https://wa.me/254' + (school.user?.phone || '').replace(/^0/, '') 

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/billing" className="text-gray-400 hover:text-gray-600 text-sm">← Back to billing</Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-4">School details</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">School name</span>
                <span className="text-sm font-medium">{school.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Admin name</span>
                <span className="text-sm font-medium">{school.user?.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium">{school.user?.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Paybill</span>
                <span className="text-sm font-medium">{school.paybill || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Current term</span>
                <span className="text-sm font-medium">{school.currentTerm}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-gray-500">Joined</span>
                <span className="text-sm font-medium">{new Date(school.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-4">Subscription & usage</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Plan</span>
                <span className="text-sm font-medium">{planName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Monthly fee</span>
                <span className="text-sm font-medium">KES {plan.monthly.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Setup fee</span>
                <span className="text-sm font-medium">KES {plan.setup.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Students</span>
                <span className="text-sm font-medium">{studentCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Fees expected</span>
                <span className="text-sm font-medium">KES {totalExpected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-gray-500">Fees collected</span>
                <span className="text-sm font-medium text-green-700">KES {totalCollected.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-medium text-gray-900 mb-4">Quick actions</h2>
         <div className="flex gap-3">
  
    href={mailtoLink}
    className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
  >
    Send email
  </a>
  
    href={waLink}
    target="_blank"
    rel="noopener noreferrer"
    className="text-white px-4 py-2 rounded-lg text-sm"
    style={{backgroundColor: '#0a1f4e'}}
  >
    WhatsApp admin
  </a>
</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-medium text-gray-900 mb-4">Notes</h2>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              placeholder="Add a note about this school..."
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNote()}
            />
            <button
              onClick={addNote}
              className="text-white px-4 py-2 rounded-lg text-sm"
              style={{backgroundColor: '#0a1f4e'}}
            >
              Add note
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400">No notes yet. Add a note to keep track of conversations with this school.</p>
          ) : (
            <div className="space-y-2">
              {notes.map((n, i) => (
                <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 border border-gray-100">
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}