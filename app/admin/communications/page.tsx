'use client'
import { useState, useEffect } from 'react'

const RECIPIENT_OPTIONS = [
  { value: 'all', label: 'All schools' },
  { value: 'trial', label: 'Trial schools only' },
  { value: 'active', label: 'Active/subscribed schools' },
  { value: 'plan:Starter', label: 'Starter plan' },
  { value: 'plan:Growth', label: 'Growth plan' },
  { value: 'plan:Premium', label: 'Premium plan' },
  { value: 'plan:Enterprise', label: 'Enterprise plan' },
]

export default function AdminCommunications() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [recipientType, setRecipientType] = useState('all')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [schoolCount, setSchoolCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/communications').then(r => r.json()).then(d => { setHistory(Array.isArray(d) ? d : []); setHistoryLoading(false) })
    fetch('/api/admin/schools').then(r => r.json()).then(d => setSchoolCount(Array.isArray(d) ? d.length : 0))
  }, [])

  async function handleSend() {
    if (!subject.trim() || !message.trim() || sending) return
    setSending(true); setResult(null)
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, recipientType }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, text: `Sent to ${data.sentCount} school${data.sentCount !== 1 ? 's' : ''}` })
        setHistory(prev => [data.record, ...prev])
        setSubject(''); setMessage('')
      } else {
        setResult({ ok: false, text: data.error || 'Failed to send' })
      }
    } catch { setResult({ ok: false, text: 'Something went wrong' }) }
    setSending(false)
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Announcements</h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>Send emails to all or selected schools</p>
      </div>

      {/* Compose */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>Send announcement</h2>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '5px' }}>Recipients</label>
          <select value={recipientType} onChange={e => setRecipientType(e.target.value)}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
            {RECIPIENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {schoolCount !== null && (
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>
              Preview: approx {recipientType === 'all' ? schoolCount : '?'} recipients
            </p>
          )}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '5px' }}>Subject line</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Important: platform update"
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '5px' }}>Message</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6}
            placeholder="Write your message here. Supports plain text — each line break is preserved."
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        {result && (
          <div style={{ background: result.ok ? '#e1f5ee' : '#fcebeb', border: `1px solid ${result.ok ? '#bbf7d0' : '#fecaca'}`, color: result.ok ? '#166534' : '#a32d2d', fontSize: '13px', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px', fontWeight: 600 }}>
            {result.text}
          </div>
        )}

        <button onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()}
          style={{ background: (sending || !subject.trim() || !message.trim()) ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: (sending || !subject.trim() || !message.trim()) ? 'not-allowed' : 'pointer' }}>
          {sending ? 'Sending…' : 'Send to all selected schools'}
        </button>
      </div>

      {/* History */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>Message history</h2>
        {historyLoading ? (
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading…</p>
        ) : history.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>No announcements sent yet.</p>
        ) : (
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {['Date', 'Subject', 'Recipients', 'Sent by'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(ann => (
                <tr key={ann.id} style={{ borderBottom: '1px solid #f8f9fc' }}>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(ann.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{ann.subject}</td>
                  <td style={{ padding: '10px 12px', color: '#475569' }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>{ann.recipientCount} schools</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{ann.sentBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
