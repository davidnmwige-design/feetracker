'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function checkPassword(p: string) {
  return {
    length: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
  }
}

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div style={{ fontSize: '11px', color: met ? '#0a7c4e' : '#94a3b8', display: 'flex', gap: '5px' }}>
      <span>{met ? 'Yes' : 'No'}</span>
      <span>{label}</span>
    </div>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const rules = checkPassword(password)
  const passwordValid = rules.length && rules.upper && rules.lower && rules.number
  const passwordsMatch = password === confirm && confirm.length > 0

  async function handleSubmit() {
    if (!passwordValid || !passwordsMatch) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      return
    }
    setDone(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  if (!token) {
    return (
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <p style={{ color: '#e24b4a', fontSize: '14px' }}>Invalid reset link. Please request a new one.</p>
        <Link href="/forgot-password" style={{ color: '#c8a84b', fontWeight: 600, fontSize: '13px', textDecoration: 'none', marginTop: '16px', display: 'block' }}>
          Request new link
        </Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px' }}>
      {done ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: '#e1f5ee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>Done</div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ep-text-primary)', marginBottom: '8px' }}>Password updated</h2>
          <p style={{ fontSize: '13px', color: 'var(--ep-text-secondary)' }}>Redirecting you to sign in...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--ep-text-secondary)', lineHeight: '1.6', margin: 0 }}>
            Choose a strong new password for your account.
          </p>

          {error && (
            <div style={{ background: '#fcebeb', border: '1px solid #f5c6c6', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: '#a32d2d' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px' }}>New password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                style={{ paddingRight: '50px' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--ep-text-secondary)', fontWeight: 600 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px' }}>
                <PasswordRule met={rules.length} label="At least 8 characters" />
                <PasswordRule met={rules.upper} label="One uppercase letter" />
                <PasswordRule met={rules.lower} label="One lowercase letter" />
                <PasswordRule met={rules.number} label="One number" />
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ep-text-primary)', display: 'block', marginBottom: '6px' }}>Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p style={{ fontSize: '11px', color: '#e24b4a', marginTop: '4px' }}>Passwords do not match</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !passwordValid || !passwordsMatch}
            style={{
              background: (loading || !passwordValid || !passwordsMatch) ? '#94a3b8' : '#0a1f4e',
              color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
              border: 'none', cursor: (loading || !passwordValid || !passwordsMatch) ? 'not-allowed' : 'pointer', width: '100%'
            }}
          >
            {loading ? 'Updating...' : 'Set new password'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ep-text-secondary)' }}>
            <Link href="/login" style={{ color: '#c8a84b', fontWeight: 600, textDecoration: 'none' }}>
              ← Back to sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

export default function ResetPassword() {
  return (
    <div style={{ background: 'var(--ep-bg-secondary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: 'var(--ep-card-bg)', borderRadius: '10px', border: '1px solid var(--ep-border)', width: '100%', maxWidth: '380px', overflow: 'hidden' }}>
        <div style={{ background: '#0a1f4e', padding: '28px 32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0 }}><span style={{ color: '#fff' }}>Elimu</span><span style={{ color: '#c8a84b' }}> Pay</span></h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '6px' }}>Set a new password</p>
        </div>
        <Suspense fallback={<div style={{ padding: '32px', textAlign: 'center', color: 'var(--ep-text-tertiary)' }}>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
