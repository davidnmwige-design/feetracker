'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Students() {
  const [students, setStudents] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
    setLoading(true)
    const res = await fetch('/api/students')
    const data = await res.json()
    setStudents(data)
    setLoading(false)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('schoolId', '1')
    await fetch('/api/students', { method: 'POST', body: formData })
    await fetchStudents()
    setFile(null)
    setUploading(false)
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.class.toLowerCase().includes(search.toLowerCase()) ||
    s.admNo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h2 className="font-medium text-gray-900 mb-1">Upload student list</h2>
          <p className="text-sm text-gray-400 mb-3">
            Your Excel file should have columns: Adm No, Name, Class, Stream, Parent Name, Parent Phone, Fee Required
          </p>
          <div className="flex gap-3">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5"
            />
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-medium text-gray-900">{students.length} students</h2>
            <input
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 w-48"
              placeholder="Search name or class..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="p-3">Adm No</th>
                <th className="p-3">Name</th>
                <th className="p-3">Class</th>
                <th className="p-3">Parent phone</th>
                <th className="p-3">Fee required</th>
                <th className="p-3">Paid</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="p-4 text-center text-gray-400">Loading...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-gray-400">No students yet. Upload a student list to get started.</td></tr>
              )}
              {filtered.map(student => {
                const paid = student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
                const balance = student.feeRequired - paid
                const status = balance <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'
                const statusColor = status === 'Paid' ? 'bg-green-100 text-green-700' : status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                return (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 text-gray-400">{student.admNo}</td>
                    <td className="p-3 font-medium">{student.name}</td>
                    <td className="p-3 text-gray-500">{student.class} {student.stream}</td>
                    <td className="p-3 text-gray-500">{student.parentPhone || '—'}</td>
                    <td className="p-3">KES {student.feeRequired.toLocaleString()}</td>
                    <td className="p-3 text-green-700">KES {paid.toLocaleString()}</td>
                    <td className="p-3 text-amber-600">KES {balance.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}