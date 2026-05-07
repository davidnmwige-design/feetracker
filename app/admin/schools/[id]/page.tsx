'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const PLANS = {
  Starter: { monthly: 4500, setup: 15000 },
  Growth: { monthly: 6500, setup: 20000 },
  Premium: { monthly: 9000, setup: 25000 },
  Enterprise: { monthly: 15000, setup: 35000 },
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function SchoolDetail() {
  const { id } = useParams()
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState<any[]>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [addingNote, setAddingNote] = useState(false)
  const [billingHistory, setBillingHistory] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/schools/' + id)
      .then(r => r.json())
      .then(data => {
        setSchool(data)
        setLoading(false)
      })

    fetch('/api/admin/schools/' + id + '/notes')
      .then(r => r.json())
      .then(data => {
        setNotes(Array.isArray(data) ? data : [])
        setNotesLoading(false)
      })

    fetch('/api/admin/billing?schoolId=' + id)
      .then(r => r.json())
      .then(data => setBillingHistory(Array.isArray(data) ? data : []))
  }, [id])

  async function addNote() {
    if (!note.trim() || addingNote) return
    setAddingNote(true)
    const res = await fetch('/api/admin/schools/' + id + '/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: note.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setNotes(prev => [data, ...prev])
      setNote('')
    }
    setAddingNote(false)
  }

  async function deleteNote(noteId: number) {
    await fetch('/api/admin/schools/' + id + '/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId }),
    })
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
  if (!school) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">School not found</div>

  const studentCount = school._count?.students || 0
  const planName = school.currentPlan || 'Starter'
  const plan = PLANS[planName as keyof typeof PLANS] || PLANS.Starter
  const totalExpected = school.students?.reduce((sum: number, s: any) => sum + s.feeRequired, 0) || 0
  const totalCollected = school.students?.reduce((sum: number, s: any) =>
    sum + s.payments.reduce((p: number, pay: any) => p + pay.amount, 0), 0) || 0

  const paidBilling = billingHistory.filter(r => r.isPaid)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/billing" className="text-gray-400 hover:text-gray-600 text-sm">← Back to billing</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <h2 className="font-medium text-gray-900 mb-4">Subscription and usage</h2>
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
            <button
              onClick={() => window.location.href = 'mailto:' + school.user?.email}
              className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Send email
            </button>
            <button
              onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent('Hi ' + school.user?.name + ', this is FeeTracker support.'), '_blank')}
              className="text-white px-4 py-2 rounded-lg text-sm"
              style={{backgroundColor: '#0a1f4e'}}
            >
              WhatsApp admin
            </button>
          </div>
        </div>

        {/* Billing history */}
        {paidBilling.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <h2 className="font-medium text-gray-900 mb-4">Payment history</h2>
            <div className="space-y-2">
              {paidBilling.map((r: any) => (
                <div key={r.id} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 font-medium">{MONTH_NAMES[r.month - 1]} {r.year}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">KES {r.amount.toLocaleString()}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Paid</span>
                    {r.paidAt && (
                      <span className="text-xs text-gray-400">{new Date(r.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              disabled={addingNote || !note.trim()}
              className="text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              style={{backgroundColor: '#0a1f4e'}}
            >
              {addingNote ? 'Adding...' : 'Add note'}
            </button>
          </div>
          {notesLoading ? (
            <p className="text-sm text-gray-400">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-gray-400">No notes yet. Add a note to keep track of conversations with this school.</p>
          ) : (
            <div className="space-y-2">
              {notes.map((n: any) => (
                <div key={n.id} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 border border-gray-100 flex justify-between items-start gap-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      {new Date(n.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {' · '}
                      {new Date(n.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p>{n.content}</p>
                  </div>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="text-gray-300 hover:text-red-400 text-xs flex-shrink-0 mt-1"
                    title="Delete note"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
