'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Back</Link>
          <h1 className="text-2xl font-semibold text-gray-900">Upload MPESA Statement</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-medium text-gray-900 mb-1">How to get your MPESA statement</h2>
          <ol className="text-sm text-gray-500 list-decimal list-inside space-y-1 mb-6">
            <li>Log into the Safaricom Business portal</li>
            <li>Go to Transactions and select your date range</li>
            <li>Download as Excel or CSV</li>
            <li>Upload that file below</li>
          </ol>

          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500">Click to select your MPESA statement</p>
                <p className="text-sm text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full mt-4 bg-green-700 text-white py-2 rounded-lg text-sm hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upload and match payments'}
          </button>
        </div>

        {results && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-medium text-gray-900 mb-4">Upload Results</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-gray-900">{results.total}</p>
                <p className="text-xs text-gray-400 mt-1">Total transactions</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-green-700">{results.matched}</p>
                <p className="text-xs text-gray-400 mt-1">Matched</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-semibold text-red-600">{results.unmatched}</p>
                <p className="text-xs text-gray-400 mt-1">Needs review</p>
              </div>
            </div>

            {results.notifications.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">WhatsApp notifications preview</h3>
                <div className="space-y-2">
                  {results.notifications.map((msg: string, i: number) => (
                    <div key={i} className="bg-green-50 border-l-4 border-green-600 p-3 text-sm text-gray-700 rounded">
                      {msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link href="/dashboard" className="block text-center mt-4 text-green-700 text-sm hover:underline">
              View dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}