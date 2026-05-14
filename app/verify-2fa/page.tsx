'use client'
import { useState, useEffect, useRef } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Verify2FA() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleVerify() {
    if (code.length !== 6 || loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (res.ok) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.error || 'Invalid code. Please try again.')
        setCode('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '380px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: '#0a1f4e', padding: '28px 32px', textAlign: 'center' }}>
          <h1 style={{ color: '#c8a84b', fontSize: '22px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0 }}>FeeTracker</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '6px', marginBottom: 0 }}>Two-factor authentication</p>
        </div>

        <div style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Enter verification code</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
            Enter the 6-digit code from your Google Authenticator app.
          </p>

          {error && (
            <div style={{ background: '#fcebeb', border: '1px solid #f5c6c6', color: '#a32d2d', fontSize: '13px', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            placeholder="000000"
            style={{
              width: '100%', border: '2px solid #0a1f4e', borderRadius: '8px',
              padding: '14px 16px', fontSize: '24px', fontWeight: 700, letterSpacing: '0.4em',
              textAlign: 'center', outline: 'none', boxSizing: 'border-box',
              color: '#0f172a',
            }}
          />

          <button
            onClick={handleVerify}
            disabled={code.length !== 6 || loading}
            style={{
              marginTop: '16px', width: '100%',
              background: (code.length !== 6 || loading) ? '#94a3b8' : '#0a1f4e',
              color: '#fff', border: 'none', padding: '12px', borderRadius: '7px',
              fontSize: '14px', fontWeight: 700,
              cursor: (code.length !== 6 || loading) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
