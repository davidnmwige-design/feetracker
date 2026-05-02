'use client'
import { useState, useEffect } from 'react'

export default function Reminders() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/students')
      .then(r => r.json())
      .then(data => {
        setStudents(data)
        setLoading(false)
      })
  }, [])

  function getPaid(student: any) {
    return student.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
  }

  function getBalance(student: any) {
    return student.feeRequired - getPaid(student)
  }

  function getMessage(student: any) {
    const balance = getBalance(student)
    const balanceStr = balance.toLocaleString()
    const name = student.parentName || 'Parent'
    const studentName = student.name
    const cls = student.class + ' ' + student.stream
    return 'Dear ' + name + ', this is a reminder that ' + studentName + ' (' + cls + ') has an outstanding fee balance of KES ' + balanceStr + ' for this term. Please make payment to our MPESA paybill at your earliest convenience. Thank you. - FeeTracker'
  }

  function copyMessage(id: number, msg: string) {
    navigator.clipboard.writeText(msg)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const withBalance = students.filter(s => getBalance(s) > 0)
  const totalOutstanding = withBalance.reduce((sum, s) => sum + getBalance(s), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Reminders</h1>
          <p className="text-gray-500 text-sm mt-1">
  {withBalance.length} parents with outstanding balances · KES {totalOutstanding.toLocaleString()} total
</p>
        </div>{withBalance.length > 0 && (
  <button
    onClick={() => {
      withBalance.forEach((student, i) => {
        const msg = getMessage(student)
        const phone = '254' + student.parentPhone.replace(/^0/, '')
        const url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(msg)
        setTimeout(() => window.open(url, '_blank'), i * 1500)
      })
    }}
    className="mt-4 px-6 py-2.5 rounded-lg text-sm font-medium text-white"
    style={{backgroundColor: '#0a1f4e'}}
  >
    Send WhatsApp to all {withBalance.length} parents
  </button>
)}

        {loading && (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        )}

        {!loading && withBalance.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400">No outstanding balances. All students are fully paid!</p>
          </div>
        )}

        <div className="space-y-3">
          {withBalance.map(student => {
            const balance = getBalance(student)
            const paid = getPaid(student)
            const percent = Math.round((paid / student.feeRequired) * 100)
            const msg = getMessage(student)
            const waLink = 'https://wa.me/254' + student.parentPhone.replace(/^0/, '') + '?text=' + encodeURIComponent(msg)

            return (
              <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-400">{student.class} {student.stream} · {student.parentName || 'Parent'} · {student.parentPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-semibold">KES {balance.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{percent}% paid</p>
                  </div>
                </div>

                <div className="bg-green-50 border-l-4 border-green-600 p-3 rounded text-sm text-gray-700 mb-3">
                  {msg}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyMessage(student.id, msg)}
                    className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600"
                  >
                    {copied === student.id ? 'Copied!' : 'Copy message'}
                  </button>
                  {student.parentPhone && (
                   <a 
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800"
                    >
                      Send on WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}