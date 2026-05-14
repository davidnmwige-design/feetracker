'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getAnnualTotal, getBillingAmount, getSetupFee, getPlanName } from '@/lib/pricing'

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
  const [contract, setContract] = useState<{ fileName: string; fileSize: number; uploadedAt: string } | null>(null)
  const [contractLoading, setContractLoading] = useState(true)
  const [contractUploading, setContractUploading] = useState(false)
  const [contractDeleting, setContractDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/schools/' + id)
      .then(r => r.json())
      .then(data => { setSchool(data); setLoading(false) })

    fetch('/api/admin/schools/' + id + '/notes')
      .then(r => r.json())
      .then(data => { setNotes(Array.isArray(data) ? data : []); setNotesLoading(false) })

    fetch('/api/admin/billing?schoolId=' + id)
      .then(r => r.json())
      .then(data => setBillingHistory(Array.isArray(data) ? data : []))

    fetch('/api/admin/schools/' + id + '/contract?meta=1')
      .then(r => r.ok ? r.json() : null)
      .then(data => { setContract(data || null); setContractLoading(false) })
      .catch(() => { setContract(null); setContractLoading(false) })
  }, [id])

  async function uploadContract(file: File) {
    setContractUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/schools/' + id + '/contract', { method: 'POST', body: fd })
    if (res.ok) setContract(await res.json())
    setContractUploading(false)
  }

  async function deleteContract() {
    if (!confirm('Delete this contract?')) return
    setContractDeleting(true)
    await fetch('/api/admin/schools/' + id + '/contract', { method: 'DELETE' })
    setContract(null)
    setContractDeleting(false)
  }

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
  const planName = getPlanName(studentCount)
  const cycle = (school.billingCycle as 'monthly' | 'term' | 'annual') || 'monthly'
  const annualFee = getAnnualTotal(studentCount)
  const billingAmt = getBillingAmount(studentCount, cycle)
  const setupFee = getSetupFee(studentCount)
  const totalExpected = school.students?.reduce((sum: number, s: any) => sum + s.feeRequired, 0) || 0
  const totalCollected = school.students?.reduce((sum: number, s: any) =>
    sum + s.payments.reduce((p: number, pay: any) => p + pay.amount, 0), 0) || 0

  const paidBilling = billingHistory.filter(r => r.isPaid)

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="mb-6">
        <Link href="/admin/schools" className="text-gray-400 hover:text-gray-600 text-sm">← Back to schools</Link>
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
            <h2 className="font-medium text-gray-900 mb-4">Integration Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Paybill number</span>
                <span className="text-sm font-medium">{school.paybill || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Daraja API</span>
                <span className={`text-sm font-semibold ${(school as any).darajaEnabled ? 'text-green-700' : 'text-gray-400'}`}>
                  {(school as any).darajaEnabled ? 'Configured ✓' : 'Not configured'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-sm text-gray-500">Last Daraja payment</span>
                <span className="text-sm font-medium">
                  {(school as any).lastDarajaPayment
                    ? new Date((school as any).lastDarajaPayment.paidAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-4">Subscription and usage</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Plan tier</span>
                <span className="text-sm font-medium">{planName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Annual subscription</span>
                <span className="text-sm font-medium">{studentCount} × KES 200 = KES {annualFee.toLocaleString()}/yr</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Billing cycle</span>
                <span className="text-sm font-medium capitalize">{cycle}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Amount per period</span>
                <span className="text-sm font-medium">KES {billingAmt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Setup fee</span>
                <span className="text-sm font-medium">KES {setupFee.toLocaleString()}</span>
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
              onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent('Hi ' + school.user?.name + ', this is Elimu Pay support.'), '_blank')}
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

        {/* Contract section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-medium text-gray-900 mb-4">Contract</h2>
          {contractLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : contract ? (
            <div>
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{contract.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {(contract.fileSize / 1024).toFixed(1)} KB · Uploaded {new Date(contract.uploadedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <a href={'/api/admin/schools/' + id + '/contract'} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:underline font-medium">
                  View PDF
                </a>
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">
                  {contractUploading ? 'Uploading…' : 'Replace contract'}
                  <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && uploadContract(e.target.files[0])} />
                </label>
                <button onClick={deleteContract} disabled={contractDeleting}
                  className="border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
                  {contractDeleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400 mb-3">No contract uploaded for this school.</p>
              <label className="cursor-pointer inline-block text-white px-4 py-2 rounded-lg text-sm" style={{ backgroundColor: '#0a1f4e' }}>
                {contractUploading ? 'Uploading…' : 'Upload contract PDF'}
                <input type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && uploadContract(e.target.files[0])} />
              </label>
            </div>
          )}
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
  )
}
