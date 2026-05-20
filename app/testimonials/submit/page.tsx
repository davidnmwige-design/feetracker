'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SubmitForm() {
  const searchParams = useSearchParams()
  const schoolId = searchParams.get('school')
  const token = searchParams.get('token')

  const [form, setForm] = useState({ authorName: '', authorTitle: '', quote: '', rating: 5 })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const stars = [1, 2, 3, 4, 5]

  async function handleSubmit() {
    if (!form.authorName.trim() || !form.quote.trim() || form.quote.length < 20) {
      setError('Please fill in all required fields (minimum 20 characters for your experience).')
      return
    }
    setSubmitting(true); setError('')
    const res = await fetch('/api/testimonials/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolId, token, ...form }),
    })
    if (res.ok) { setDone(true) }
    else { const d = await res.json(); setError(d.error || 'Something went wrong') }
    setSubmitting(false)
  }

  if (!schoolId || !token) return (
    <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Invalid link. Please use the link from your email.</div>
  )

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
        <div style={{ background: '#0a1f4e', padding: '24px 32px', textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontFamily: 'Georgia, serif', fontSize: '22px', margin: 0 }}>
            Elimu<span style={{ color: '#c8a84b' }}> Pay</span>
          </h1>
          <p style={{ color: '#94a3c8', fontSize: '12px', margin: '6px 0 0' }}>Share your experience</p>
        </div>

        {done ? (
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🙏</div>
            <h2 style={{ color: '#0a7c3e', fontSize: '18px', marginBottom: '8px' }}>Thank you!</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Your testimonial has been submitted. We really appreciate your feedback.</p>
          </div>
        ) : (
          <div style={{ padding: '32px' }}>
            {error && <div style={{ background: '#fcebeb', border: '1px solid #fecaca', color: '#a32d2d', fontSize: '13px', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Your name *</label>
                <input value={form.authorName} onChange={e => setForm(f => ({ ...f, authorName: e.target.value }))}
                  placeholder="e.g. Jane Wambui"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Your title (optional)</label>
                <input value={form.authorTitle} onChange={e => setForm(f => ({ ...f, authorTitle: e.target.value }))}
                  placeholder="e.g. Bursar, Principal"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '8px' }}>Your rating *</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {stars.map(s => (
                    <button key={s} type="button" onClick={() => setForm(f => ({ ...f, rating: s }))}
                      style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: s <= form.rating ? '#c8a84b' : '#e2e8f0' }}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px' }}>Your experience * <span style={{ fontWeight: 400, color: '#94a3b8' }}>(min 20 chars)</span></label>
                <textarea value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
                  placeholder="Tell us how Elimu Pay has helped your school manage fees..."
                  rows={4}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                <p style={{ fontSize: '11px', color: form.quote.length >= 20 ? '#0a7c3e' : '#94a3b8', margin: '4px 0 0' }}>{form.quote.length} characters</p>
              </div>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ background: submitting ? '#94a3b8' : '#0a1f4e', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting...' : 'Submit testimonial'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TestimonialSubmitPage() {
  return <Suspense><SubmitForm /></Suspense>
}
