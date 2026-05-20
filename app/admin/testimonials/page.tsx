'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/testimonials').then(r => r.json()).then(d => { setTestimonials(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  async function toggle(id: number, approved: boolean) {
    const res = await fetch(`/api/admin/testimonials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved }),
    })
    if (res.ok) setTestimonials(prev => prev.map(t => t.id === id ? { ...t, approved } : t))
  }

  const submitted = testimonials.filter(t => t.submittedAt)
  const pending = submitted.filter(t => !t.approved)
  const approved = submitted.filter(t => t.approved)

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', background: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Testimonials</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{pending.length} pending · {approved.length} approved</p>
          </div>
          <Link href="/admin/dashboard" style={{ fontSize: '13px', color: '#0a1f4e', textDecoration: 'none' }}>← Back</Link>
        </div>

        {loading ? <p style={{ color: '#94a3b8' }}>Loading...</p> : submitted.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No testimonials submitted yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {submitted.map(t => (
              <div key={t.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{t.schoolName || 'Unknown School'}</span>
                      {t.approved && <span style={{ fontSize: '10px', background: '#e1f5ee', color: '#0a7c3e', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>Approved</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{t.authorName}{t.authorTitle ? ` · ${t.authorTitle}` : ''}</p>
                    {t.rating && <p style={{ fontSize: '14px', color: '#c8a84b', margin: '4px 0 0' }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {!t.approved ? (
                      <button onClick={() => toggle(t.id, true)}
                        style={{ background: '#0a7c3e', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        Approve
                      </button>
                    ) : (
                      <button onClick={() => toggle(t.id, false)}
                        style={{ background: 'none', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
                {t.quote && <p style={{ fontSize: '14px', color: '#0f172a', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
