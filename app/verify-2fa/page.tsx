'use client'
import { useState, useEffect, useRef } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Verify2FA() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [sending, setSending] = useState(true)
  const [sendError, setSendError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [ready, setReady] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('ep_2fa_email')
    const storedPassword = sessionStorage.getItem('ep_2fa_password')

    if (!storedEmail || !storedPassword) {
      // No credentials in sessionStorage — go back to login
      router.replace('/login')
      return
    }

    setEmail(storedEmail)
    setPassword(storedPassword)
    setReady(true)
    sendOtp(storedEmail)

    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  async function sendOtp(emailArg?: string) {
    const target = emailArg ?? email
    if (!target) return
    setSending(true)
    setSendError('')
    try {
      const res = await fetch('/api/auth/2fa/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      })
      const data = await res.json()
      if (res.ok) {
        setMaskedEmail(data.maskedEmail || '')
        startCooldown()
        setTimeout(() => inputRef.current?.focus(), 100)
      } else {
        setSendError(data.error || 'Failed to send code. Please try again.')
      }
    } catch {
      setSendError('Failed to send code. Please try again.')
    }
    setSending(false)
  }

  function startCooldown() {
    setCooldown(60)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  async function handleVerify() {
    if (code.length !== 6 || loading) return
    setLoading(true)
    setError('')

    try {
      // Step 1: verify OTP + validate credentials server-side, sets ft_2fa cookie
      const verifyRes = await fetch('/api/auth/2fa/verify-and-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code }),
      })
      const verifyData = await verifyRes.json()

      if (!verifyRes.ok) {
        setError(verifyData.error || 'Invalid code. Please try again.')
        setCode('')
        inputRef.current?.focus()
        setLoading(false)
        return
      }

      // Step 2: OTP verified — now create the NextAuth session
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError('Sign in failed. Please return to the login page and try again.')
        setLoading(false)
        return
      }

      // Step 3: clean up and navigate
      sessionStorage.removeItem('ep_2fa_email')
      sessionStorage.removeItem('ep_2fa_password')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  // While checking sessionStorage / redirecting, render nothing
  if (!ready) return null

  return (
    <div style={{ background: '#f8f9fc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', width: '100%', maxWidth: '400px', overflow: 'hidden' }}>

        <div style={{ background: '#0a1f4e', padding: '28px 32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Georgia, serif', margin: 0 }}>
            <span style={{ color: '#fff' }}>Elimu</span><span style={{ color: '#c8a84b' }}> Pay</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '6px', marginBottom: 0 }}>Two-factor authentication</p>
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', background: '#f0f4ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>
              ✉
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Check your email</h2>
            {sending ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Sending verification code…</p>
            ) : sendError ? (
              <p style={{ fontSize: '13px', color: '#a32d2d', margin: 0 }}>{sendError}</p>
            ) : (
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                We sent a 6-digit code to <strong>{maskedEmail}</strong>
              </p>
            )}
          </div>

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
            disabled={sending}
            style={{
              width: '100%', border: '2px solid #0a1f4e', borderRadius: '8px',
              padding: '14px 16px', fontSize: '28px', fontWeight: 700, letterSpacing: '0.4em',
              textAlign: 'center', outline: 'none', boxSizing: 'border-box',
              color: '#0f172a', marginBottom: '12px',
            }}
          />

          <button
            onClick={handleVerify}
            disabled={code.length !== 6 || loading || sending}
            style={{
              width: '100%',
              background: (code.length !== 6 || loading || sending) ? '#94a3b8' : '#c8a84b',
              color: (code.length !== 6 || loading || sending) ? '#fff' : '#0a1f4e',
              border: 'none', padding: '12px', borderRadius: '7px',
              fontSize: '14px', fontWeight: 700, marginBottom: '16px',
              cursor: (code.length !== 6 || loading || sending) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>

          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            {cooldown > 0 ? (
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Resend in {cooldown}s</span>
            ) : (
              <button
                onClick={() => sendOtp()}
                disabled={sending}
                style={{ background: 'none', border: 'none', color: '#0a1f4e', fontSize: '13px', cursor: sending ? 'not-allowed' : 'pointer', textDecoration: 'underline', fontWeight: 600 }}
              >
                {sending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => {
                sessionStorage.removeItem('ep_2fa_email')
                sessionStorage.removeItem('ep_2fa_password')
                signOut({ callbackUrl: '/login' })
              }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Use a different account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
