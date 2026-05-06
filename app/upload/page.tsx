'use client'
import { useState } from 'react'
import Link from 'next/link'

const BANK_OPTIONS = [
  { value: 'mpesa', label: 'MPESA (Safaricom)' },
  // Commercial Banks
  { value: 'equity', label: 'Equity Bank' },
  { value: 'kcb', label: 'KCB Bank' },
  { value: 'coop', label: 'Co-operative Bank' },
  { value: 'meb', label: 'Middle East Bank' },
  { value: 'ncba', label: 'NCBA Bank' },
  { value: 'absa', label: 'Absa Bank Kenya' },
  { value: 'stanchart', label: 'Standard Chartered Kenya' },
  { value: 'im', label: 'I&M Bank' },
  { value: 'dtb', label: 'Diamond Trust Bank' },
  { value: 'family', label: 'Family Bank' },
  { value: 'nbk', label: 'National Bank of Kenya' },
  { value: 'stanbic', label: 'Stanbic Bank Kenya' },
  { value: 'prime', label: 'Prime Bank' },
  { value: 'boa', label: 'Bank of Africa Kenya' },
  { value: 'ecobank', label: 'Ecobank Kenya' },
  { value: 'gulf', label: 'Gulf African Bank' },
  { value: 'sidian', label: 'Sidian Bank' },
  { value: 'spire', label: 'Spire Bank' },
  { value: 'creditbank', label: 'Credit Bank' },
  { value: 'consolidated', label: 'Consolidated Bank' },
  { value: 'victoria', label: 'Victoria Commercial Bank' },
  { value: 'habib', label: 'Habib Bank AG Zurich' },
  { value: 'gtb', label: 'Guaranty Trust Bank Kenya' },
  { value: 'access', label: 'Access Bank Kenya' },
  { value: 'uba', label: 'UBA Kenya' },
  { value: 'paramount', label: 'Paramount Bank' },
  { value: 'dbk', label: 'Development Bank of Kenya' },
  // Microfinance Banks
  { value: 'kwft', label: 'Kenya Women Microfinance Bank' },
  { value: 'faulu', label: 'Faulu Bank' },
  { value: 'smep', label: 'SMEP Microfinance Bank' },
  { value: 'sumac', label: 'Sumac Microfinance Bank' },
  { value: 'choice', label: 'Choice Microfinance Bank' },
  { value: 'daraja', label: 'Daraja Microfinance Bank' },
  // SACCOs
  { value: 'muramati', label: 'Muramati SACCO' },
  { value: 'mwalimu', label: 'Mwalimu National SACCO' },
  { value: 'stima', label: 'Stima SACCO' },
  { value: 'kenpol', label: 'Kenya Police SACCO' },
  { value: 'harambee', label: 'Harambee SACCO' },
  { value: 'unaitas', label: 'Unaitas SACCO' },
]

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [bankType, setBankType] = useState('mpesa')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [hovered, setHovered] = useState(false)

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setResults(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bankType', bankType)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif'}}>
      <style>{`
        @media (max-width: 640px) {
          .upl-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; padding: 16px !important; }
          .upl-content { padding: 16px !important; max-width: 100% !important; }
          .upl-results-grid { grid-template-columns: repeat(1, 1fr) !important; }
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

          <div style={{marginBottom: '20px'}}>
            <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '8px'}}>What type of statement are you uploading?</label>
            <select
              value={bankType}
              onChange={e => setBankType(e.target.value)}
              style={{width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', color: '#0f172a', background: '#fff', outline: 'none'}}
            >
              {BANK_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {bankType === 'mpesa' && (
            <div style={{background: '#f8f9fc', borderRadius: '6px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#64748b', borderLeft: '3px solid #c8a84b'}}>
              <strong style={{color: '#0f172a'}}>How to get your MPESA statement:</strong> Log into the Safaricom Business portal → Transactions → select date range → Download as Excel or CSV.
            </div>
          )}

          {bankType !== 'mpesa' && (
            <div style={{background: '#f8f9fc', borderRadius: '6px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#64748b', borderLeft: '3px solid #c8a84b'}}>
              <strong style={{color: '#0f172a'}}>Note:</strong> For bank statements, phone-number matching is not available. Unmatched payments can be manually assigned on the Unmatched Payments page.
            </div>
          )}

          <div
            style={{
              border: '2px dashed ' + (file ? '#0a1f4e' : hovered ? '#c8a84b' : '#e2e8f0'),
              borderRadius: '8px', padding: '32px', textAlign: 'center', cursor: 'pointer',
              background: file ? '#f0f4f9' : '#fafbfc', transition: 'border-color 0.2s'
            }}
            onClick={() => document.getElementById('fileInput')?.click()}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{display: 'none'}}
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <p style={{fontWeight: 600, color: '#0a1f4e', fontSize: '14px'}}>{file.name}</p>
                <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '4px'}}>{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p style={{color: '#64748b', fontSize: '14px'}}>Click to select your statement file</p>
                <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '4px'}}>Supports .xlsx, .xls, .csv</p>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            style={{
              width: '100%', marginTop: '16px',
              background: (!file || loading) ? '#94a3b8' : '#0a1f4e',
              color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
              border: 'none', cursor: (!file || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : 'Upload and match payments'}
          </button>
        </div>

        {results && (
          <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '24px'}}>
            <h2 style={{fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px'}}>Upload Results</h2>
            <div className="upl-results-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px'}}>
              <div style={{background: '#f8f9fc', borderRadius: '6px', padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0'}}>
                <p style={{fontSize: '24px', fontWeight: 700, color: '#0f172a'}}>{results.total}</p>
                <p style={{fontSize: '10px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Total</p>
              </div>
              <div style={{background: '#f0f4f9', borderRadius: '6px', padding: '12px', textAlign: 'center', border: '1px solid #d4ddf0'}}>
                <p style={{fontSize: '24px', fontWeight: 700, color: '#0a1f4e'}}>{results.matched}</p>
                <p style={{fontSize: '10px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Matched</p>
              </div>
              <div style={{background: '#fcebeb', borderRadius: '6px', padding: '12px', textAlign: 'center', border: '1px solid #f5c6c6'}}>
                <p style={{fontSize: '24px', fontWeight: 700, color: '#e24b4a'}}>{results.unmatched}</p>
                <p style={{fontSize: '10px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Needs review</p>
              </div>
            </div>

            {results.notifications?.length > 0 && (
              <div>
                <h3 style={{fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px'}}>
                  WhatsApp notifications — {results.notifications.filter((n: any) => n.phone).length} parents
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                  {results.notifications.map((n: any, i: number) => (
                    <div key={i} style={{background: '#f8f9fc', borderLeft: '3px solid #c8a84b', padding: '10px 12px', borderRadius: '0 4px 4px 0', fontSize: '12px', color: '#64748b'}}>
                      <p style={{margin: '0 0 8px', lineHeight: 1.6}}>{n.msg}</p>
                      {n.phone && (
                        <a
                          href={`https://wa.me/${n.phone}?text=${encodeURIComponent(n.msg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{display: 'inline-block', background: '#25D366', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textDecoration: 'none'}}
                        >
                          Send on WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px'}}>
              <Link href="/dashboard" style={{color: '#0a1f4e', fontSize: '13px', fontWeight: 600, textDecoration: 'none'}}>
                View dashboard →
              </Link>
              {results.unmatched > 0 && (
                <Link href="/unmatched" style={{color: '#e24b4a', fontSize: '13px', fontWeight: 600, textDecoration: 'none'}}>
                  Review {results.unmatched} unmatched →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
