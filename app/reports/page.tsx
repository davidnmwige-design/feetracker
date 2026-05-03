'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Reports() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => {
        setStudents(data)
        setLoading(false)
      })
  }, [])

  async function downloadReport() {
    setDownloading(true)
   const res = await fetch('/api/report')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fee_report.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
    setDownloading(false)
  }

  const totalExpected = students.reduce((sum, s) => sum + s.feeRequired, 0)
  const totalCollected = students.reduce((sum, s) => sum + s.payments.reduce((p: number, pay: any) => p + pay.amount, 0), 0)
  const totalBalance = totalExpected - totalCollected
  const paid = students.filter(s => s.feeRequired - s.payments.reduce((p: number, pay: any) => p + pay.amount, 0) <= 0).length
  const partial = students.filter(s => {
    const p = s.payments.reduce((sum: number, pay: any) => sum + pay.amount, 0)
    return p > 0 && p < s.feeRequired
  }).length
  const unpaid = students.filter(s => s.payments.length === 0).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
              <p className="text-gray-500 text-sm mt-0.5">Fee collection summary for this term</p>
            </div>
          </div>
          <button
            onClick={downloadReport}
            disabled={downloading}
            className="text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{backgroundColor: '#0a1f4e'}}
          >
            {downloading ? 'Downloading...' : 'Download Excel Report'}
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Expected</p>
                <p className="text-2xl font-semibold text-gray-900">KES {totalExpected.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Collected</p>
                <p className="text-2xl font-semibold text-green-700">KES {totalCollected.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Outstanding</p>
                <p className="text-2xl font-semibold text-amber-600">KES {totalBalance.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-3xl font-semibold text-green-700">{paid}</p>
                <p className="text-sm text-gray-400 mt-1">Fully paid</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-3xl font-semibold text-amber-600">{partial}</p>
                <p className="text-sm text-gray-400 mt-1">Partial payment</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-3xl font-semibold text-red-600">{unpaid}</p>
                <p className="text-sm text-gray-400 mt-1">No payment</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-medium text-gray-900">Student breakdown</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="p-3">Name</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Fee Required</th>
                    <th className="p3">Paid</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const paid = student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
                    const balance = student.feeRequired - paid
                    const status = balance <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'
                    const statusColor = status === 'Paid' ? 'bg-green-100 text-green-700' : status === 'Partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    return (
                      <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="p-3 font-medium">{student.name}</td>
                        <td className="p-3 text-gray-500">{student.class} {student.stream}</td>
                        <td className="p-3">KES {student.feeRequired.toLocaleString()}</td>
                        <td className="p-3 text-green-700">KES {paid.toLocaleString()}</td>
                        <td className="p-3 text-amber-600">KES {balance.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={'text-xs px-2 py-1 rounded-full font-medium ' + statusColor}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}