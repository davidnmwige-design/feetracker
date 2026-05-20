'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import RoleGuard from '@/components/RoleGuard'

export default function Upload() {
  useEffect(() => {
    fetch('/api/auth/check-2fa').then(r => r.json()).then(d => { if (!d.verified) window.location.href = '/verify-2fa' })
  }, [])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [hovered, setHovered] = useState(false)
  const [fileError, setFileError] = useState('')

  const isPdf = file?.name.toLowerCase().endsWith('.pdf')
  const MAX_SIZE = 4 * 1024 * 1024

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function handleFileChange(selected: File | null) {
    setFileError('')
    if (!selected) { setFile(null); return }
    if (selected.size > MAX_SIZE) {
      setFileError(`File too large (${formatBytes(selected.size)}). Maximum is 4MB. Please split your statement into smaller date ranges.`)
      setFile(null)
      return
    }
    setFile(selected)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setResults(null)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) setResults({ error: data.error || 'Upload failed' })
    else setResults(data)
    setLoading(false)
  }

  function ConfidenceDot({ level }: { level: string }) {
    const map: Record<string, { color: string; label: string }> = {
      high:   { color: '#16a34a', label: 'HIGH' },
      medium: { color: '#d97706', label: 'MED' },
      low:    { color: '#dc2626', label: 'LOW' },
    }
    const s = map[level] || { color: '#94a3b8', label: '?' }
    return <span style={{ background: s.color, color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', marginRight: '4px' }}>{s.label}</span>
  }

  return (
    <RoleGuard requiredPermission="canUpload">
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif', overflowX: 'hidden'}}>
      <style>{`
        @media (max-width: 640px) {
          .upl-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .upl-content { padding: 16px !important; max-width: 100% !important; }
          .upl-results-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div className="upl-header" style={{background: '#0a1f4e', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', marginBottom: '3px'}}>Upload Statement</h1>
          <p style={{fontSize: '12px', color: '#94a3c8'}}>Match transactions to student fee records</p>
        </div>
        <Link href="/dashboard" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
          ← Dashboard
        </Link>
      </div>

      <div className="upl-content" style={{padding: '24px 32px', maxWidth: '640px'}}>
        <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '16px'}}>

          {/* Info banner */}
          <div style={{background: '#f0f4f9', border: '1px solid #d4ddf0', borderRadius: '6px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#475569'}}>
            <strong style={{color: '#0a1f4e'}}>Intelligent parsing:</strong> Upload any Kenyan bank statement in Excel, CSV, or PDF format. The system automatically detects the format, skips debit transactions, and matches payments to students by name or admission number.
          </div>

          <div
            style={{
              border: '2px dashed ' + (file ? '#0a1f4e' : hovered ? '#c8a84b' : '#e2e8f0'),
              borderRadius: '8px', padding: '40px 32px', textAlign: 'center', cursor: 'pointer',
              background: file ? '#f0f4f9' : '#fafbfc', transition: 'border-color 0.2s',
            }}
            onClick={() => document.getElementById('fileInput')?.click()}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
              style={{display: 'none'}}
              onChange={e => { handleFileChange(e.target.files?.[0] || null); setResults(null) }}
            />
            {file ? (
              <div>
                <div style={{fontSize: '28px', marginBottom: '8px'}}>{isPdf ? 'PDF' : 'Sheet'}</div>
                <p style={{fontWeight: 700, color: '#0a1f4e', fontSize: '14px', margin: '0 0 4px'}}>{file.name}</p>
                <p style={{fontSize: '12px', color: '#94a3b8'}}>{formatBytes(file.size)} · {isPdf ? 'PDF bank statement' : 'Spreadsheet'}</p>
                <button onClick={e => { e.stopPropagation(); setFile(null) }}
                  style={{marginTop: '8px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline'}}>
                  Change file
                </button>
              </div>
            ) : (
              <div>
                <div style={{fontSize: '32px', marginBottom: '12px'}}></div>
                <p style={{color: '#0a1f4e', fontSize: '14px', fontWeight: 600, margin: '0 0 6px'}}>Click to select your statement</p>
                <p style={{fontSize: '12px', color: '#94a3b8', margin: 0}}>Supports .xlsx, .xls, .csv, .pdf · Max 4MB</p>
                <p style={{fontSize: '11px', color: '#c8a84b', margin: '6px 0 0', fontWeight: 600}}>Works with any Kenyan bank</p>
              </div>
            )}
          </div>

          {fileError && (
            <div style={{marginTop: '12px', background: '#fcebeb', border: '1px solid #f5c6c6', color: '#a32d2d', fontSize: '12px', padding: '10px 12px', borderRadius: '6px'}}>
              {fileError}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              width: '100%', marginTop: '16px',
              background: (!file || loading) ? '#94a3b8' : '#c8a84b',
              color: (!file || loading) ? '#fff' : '#0a1f4e',
              padding: '12px', borderRadius: '6px', fontSize: '14px', fontWeight: 700,
              border: 'none', cursor: (!file || loading) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Analysing statement…' : 'Upload and match payments'}
          </button>
        </div>

        {/* Error */}
        {results?.error && (
          <div style={{background: '#fcebeb', border: '1px solid #f5c6c6', color: '#a32d2d', fontSize: '13px', padding: '14px 16px', borderRadius: '8px', marginBottom: '16px'}}>
            {results.error}
          </div>
        )}

        {results && !results.error && (
          <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px'}}>

            {/* Format detection banner */}
            <div style={{background: '#e1f5ee', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#166534'}}>
              <strong>Detected:</strong> {results.formatDetected}
              {results.skippedRows > 0 && <> · Skipped {results.skippedRows} debit/header rows</>}
              · Processed {results.processedRows} incoming payment{results.processedRows !== 1 ? 's' : ''}
            </div>

            {/* Summary KPI row */}
            <div className="upl-results-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px'}}>
              <div style={{background: '#f8f9fc', borderRadius: '6px', padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0'}}>
                <p style={{fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: 0}}>{results.total}</p>
                <p style={{fontSize: '10px', color: '#94a3b8', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Transactions</p>
              </div>
              <div style={{background: '#e1f5ee', borderRadius: '6px', padding: '12px', textAlign: 'center', border: '1px solid #bbf7d0'}}>
                <p style={{fontSize: '22px', fontWeight: 700, color: '#16a34a', margin: 0}}>{results.matched}</p>
                <p style={{fontSize: '10px', color: '#94a3b8', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Auto-matched</p>
              </div>
              <div style={{background: '#fcebeb', borderRadius: '6px', padding: '12px', textAlign: 'center', border: '1px solid #fecaca'}}>
                <p style={{fontSize: '22px', fontWeight: 700, color: '#dc2626', margin: 0}}>{results.unmatched}</p>
                <p style={{fontSize: '10px', color: '#94a3b8', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Needs review</p>
              </div>
            </div>

            {/* Confidence breakdown */}
            {results.confidence && (
              <div style={{background: '#f8f9fc', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px'}}>
                <p style={{fontWeight: 700, color: '#0f172a', margin: '0 0 8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Match confidence</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <ConfidenceDot level="high" />
                    <span style={{color: '#475569'}}><strong>{results.confidence.high}</strong> matched by admission number (fully automatic)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <ConfidenceDot level="medium" />
                    <span style={{color: '#475569'}}><strong>{results.confidence.medium}</strong> matched by name (automatic)</span>
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <ConfidenceDot level="low" />
                    <span style={{color: '#475569'}}><strong>{results.confidence.low}</strong> possible match — review recommended</span>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp notifications */}
            {results.notifications?.length > 0 && (
              <div style={{marginBottom: '16px'}}>
                <h3 style={{fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px'}}>
                  WhatsApp notifications — {results.notifications.filter((n: any) => n.phone).length} parents
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto'}}>
                  {results.notifications.map((n: any, i: number) => (
                    <div key={i} style={{background: '#f8f9fc', borderLeft: '3px solid #c8a84b', padding: '10px 12px', borderRadius: '0 4px 4px 0', fontSize: '12px', color: '#64748b'}}>
                      <p style={{margin: '0 0 6px', lineHeight: 1.6}}>{n.msg}</p>
                      {n.phone && (
                        <a href={`https://wa.me/${n.phone}?text=${encodeURIComponent(n.msg)}`} target="_blank" rel="noopener noreferrer"
                          style={{display: 'inline-block', background: '#25D366', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textDecoration: 'none'}}>
                          Send on WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
              <Link href="/dashboard" style={{color: '#0a1f4e', fontSize: '13px', fontWeight: 600, textDecoration: 'none'}}>
                View dashboard →
              </Link>
              {results.unmatched > 0 && (
                <Link href="/unmatched" style={{color: '#dc2626', fontSize: '13px', fontWeight: 600, textDecoration: 'none'}}>
                  Review {results.unmatched} unmatched →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </RoleGuard>
  )
}
