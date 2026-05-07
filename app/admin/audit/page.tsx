'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const ACTIONS = ['', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'STUDENT_IMPORT', 'MPESA_UPLOAD', 'INVOICE_SENT', 'CERTIFICATE_GENERATED', 'PLAN_UPGRADE_REQUESTED', 'DATA_EXPORT', 'SIGN_OUT_ALL_DEVICES', 'ACCOUNT_DELETED']

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [schoolId, setSchoolId] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (schoolId) params.set('schoolId', schoolId)
    if (action) params.set('action', action)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    params.set('page', String(p))
    const res = await fetch('/api/admin/audit?' + params.toString())
    if (res.ok) {
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
      setPage(data.page || 1)
    }
    setLoading(false)
  }, [schoolId, action, from, to])

  useEffect(() => { fetchLogs(1) }, [fetchLogs])

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', fontFamily: 'Arial, sans-serif'}}>
      <div style={{background: '#0a1f4e', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1 style={{fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', margin: 0}}>Audit Log</h1>
          <p style={{fontSize: '12px', color: '#94a3c8', margin: '3px 0 0'}}>{total} total events</p>
        </div>
        <Link href="/admin/dashboard" style={{border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '8px 16px', borderRadius: '5px', fontSize: '12px', textDecoration: 'none'}}>
          ← Dashboard
        </Link>
      </div>

      <div style={{padding: '24px 32px', maxWidth: '1100px'}}>
        {/* Filters */}
        <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' as const, alignItems: 'flex-end'}}>
          <div>
            <label style={{fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px'}}>School ID</label>
            <input
              type="number"
              value={schoolId}
              onChange={e => setSchoolId(e.target.value)}
              placeholder="All"
              style={{width: '90px', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '6px 10px', fontSize: '13px', outline: 'none'}}
            />
          </div>
          <div>
            <label style={{fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px'}}>Action</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value)}
              style={{border: '1px solid #e2e8f0', borderRadius: '5px', padding: '6px 10px', fontSize: '13px', outline: 'none', background: '#fff'}}
            >
              {ACTIONS.map(a => <option key={a} value={a}>{a || 'All actions'}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px'}}>From</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              style={{border: '1px solid #e2e8f0', borderRadius: '5px', padding: '6px 10px', fontSize: '13px', outline: 'none'}}
            />
          </div>
          <div>
            <label style={{fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px'}}>To</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              style={{border: '1px solid #e2e8f0', borderRadius: '5px', padding: '6px 10px', fontSize: '13px', outline: 'none'}}
            />
          </div>
          <button
            onClick={() => fetchLogs(1)}
            style={{background: '#0a1f4e', color: '#fff', padding: '7px 16px', borderRadius: '5px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer'}}
          >
            Filter
          </button>
          <button
            onClick={() => { setSchoolId(''); setAction(''); setFrom(''); setTo('') }}
            style={{background: '#f1f5f9', color: '#64748b', padding: '7px 12px', borderRadius: '5px', fontSize: '13px', border: 'none', cursor: 'pointer'}}
          >
            Clear
          </button>
        </div>

        {/* Table */}
        <div style={{background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
          <table style={{width: '100%', borderCollapse: 'collapse' as const}}>
            <thead>
              <tr style={{background: '#f8f9fc', borderBottom: '1px solid #e2e8f0'}}>
                {['ID', 'Action', 'School ID', 'User ID', 'Details', 'IP', 'Time'].map(h => (
                  <th key={h} style={{padding: '10px 14px', textAlign: 'left' as const, fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{padding: '32px', textAlign: 'center' as const, color: '#94a3b8', fontSize: '13px'}}>Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} style={{padding: '32px', textAlign: 'center' as const, color: '#94a3b8', fontSize: '13px'}}>No audit logs found.</td></tr>
              ) : logs.map((log, i) => (
                <tr key={log.id} style={{borderBottom: i < logs.length - 1 ? '1px solid #f1f5f9' : 'none'}}>
                  <td style={{padding: '10px 14px', fontSize: '12px', color: '#94a3b8'}}>{log.id}</td>
                  <td style={{padding: '10px 14px', fontSize: '12px'}}>
                    <span style={{
                      background: log.action.includes('FAILURE') ? '#fee2e2' : log.action.includes('DELETE') ? '#fee2e2' : '#f0f4ff',
                      color: log.action.includes('FAILURE') ? '#dc2626' : log.action.includes('DELETE') ? '#dc2626' : '#0a1f4e',
                      padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '11px'
                    }}>{log.action}</span>
                  </td>
                  <td style={{padding: '10px 14px', fontSize: '12px', color: '#64748b'}}>{log.schoolId ?? '—'}</td>
                  <td style={{padding: '10px 14px', fontSize: '12px', color: '#64748b'}}>{log.userId ?? '—'}</td>
                  <td style={{padding: '10px 14px', fontSize: '12px', color: '#475569', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const}}>{log.details || '—'}</td>
                  <td style={{padding: '10px 14px', fontSize: '11px', color: '#94a3b8'}}>{log.ipAddress || '—'}</td>
                  <td style={{padding: '10px 14px', fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' as const}}>
                    {new Date(log.createdAt).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px'}}>
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              style={{background: page <= 1 ? '#f1f5f9' : '#0a1f4e', color: page <= 1 ? '#94a3b8' : '#fff', padding: '7px 14px', borderRadius: '5px', fontSize: '13px', border: 'none', cursor: page <= 1 ? 'not-allowed' : 'pointer'}}
            >
              Previous
            </button>
            <span style={{padding: '7px 14px', fontSize: '13px', color: '#64748b'}}>Page {page} of {pages}</span>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= pages}
              style={{background: page >= pages ? '#f1f5f9' : '#0a1f4e', color: page >= pages ? '#94a3b8' : '#fff', padding: '7px 14px', borderRadius: '5px', fontSize: '13px', border: 'none', cursor: page >= pages ? 'not-allowed' : 'pointer'}}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
