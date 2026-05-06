'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    if (!email) return
    setLoading(true)
    await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div style={{background: '#f8f9fc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif'}}>
      <div style={{background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '380px', overflow: 'hidden'}}>
        <div style={{background: '#0a1f4e', padding: '28px 32px', textAlign: 'center'}}>
          <h1 style={{color: '#c8a84b', fontSize: '22px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0}}>FeeTracker</h1>
          <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '6px'}}>Reset your password</p>
        </div>

        <div style={{padding: '32px'}}>
          {sent ? (
            <div style={{textAlign: 'center'}}>
              <div style={{width: '48px', height: '48px', background: '#e1f5ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px'}}>
                ✓
              </div>
              <h2 style={{fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '8px'}}>Reset link sent</h2>
              <p style={{fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px'}}>
                If <strong>{email}</strong> is registered, you will receive a password reset link shortly.
              </p>
              <p style={{fontSize: '12px', color: '#94a3b8', marginBottom: '20px'}}>
                Don't see it? Check your spam folder, or contact us at{' '}
                <a href="mailto:support@feetracker.co.ke" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>support@feetracker.co.ke</a>
              </p>
              <Link href="/login" style={{display: 'block', textAlign: 'center', background: '#0a1f4e', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, textDecoration: 'none'}}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <p style={{fontSize: '13px', color: '#64748b', lineHeight: '1.6', margin: 0}}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div>
                <label style={{fontSize: '12px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '6px'}}>Email address</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !email}
                style={{
                  background: (loading || !email) ? '#94a3b8' : '#0a1f4e',
                  color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                  border: 'none', cursor: (loading || !email) ? 'not-allowed' : 'pointer', width: '100%'
                }}
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <p style={{textAlign: 'center', fontSize: '12px', color: '#64748b'}}>
                <Link href="/login" style={{color: '#c8a84b', fontWeight: 600, textDecoration: 'none'}}>
                  ← Back to sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
